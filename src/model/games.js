import _config    from 'app.config'
import localDB    from 'localforage'
import Eth        from 'Eth/Eth'
import Api        from 'Api'
import bigInt     from 'big-integer'
import Web3       from 'web3'

const web3 = new Web3()

import * as Utils from 'utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

let _games = {}
let _seeds_list = {}
let _pendings_list = {}


class Games {
	constructor(){
		this.clearTasks()
		this.load()

		this.Queue = new AsyncPriorityQueue({
			debug:               false,
			maxParallel:         1,
			processingFrequency: 350,
		})

		this.Queue.start()
	}


	/*
	 * Random
	 **/
	getConfirmNumber(seed, address, abi, callback){
		Eth.Wallet.getPwDerivedKey( PwDerivedKey => {

			let VRS = Eth.Wallet.lib.signing.signMsg(
				Eth.Wallet.getKs(),
				PwDerivedKey,
				seed,
				Eth.Wallet.get().openkey.substr(2)
			)

			let signature = Eth.Wallet.lib.signing.concatSig(VRS)


			let v = VRS.v
			let r = signature.slice(0, 66)
			let s = '0x' + signature.slice(66, 130)

			console.log('VRS type',
				(typeof v),
				(typeof r),
				(typeof s)
			)
			/* Equivalent of solidity hash function:
				function confirm(bytes32 _s) public returns(uint256){
					return uint256 (sha3(_s));
				}
			*/
			let hash    = '0x'+Eth.ABI.soliditySHA3(['bytes32'],[ s ]).toString('hex')
			let confirm = bigInt(hash,16).divmod(65536).remainder.value

			callback(confirm, PwDerivedKey, v,r,s)
		})
	}


	load(callback){
		localDB.getItem('Games', (err, games)=>{
			if (games) { this._games = games }
			if (callback) callback(games)
		})
	}

	get(callback){
		// if (_games && Object.keys(_games).length ) {
		// 	callback(_games)
		// 	return
		// }
		this.load(callback)
	}
	getSeeds(callback){
		localDB.getItem('seeds_list', (err, seeds_list)=>{
			callback(seeds_list)
		})
	}


	create(code, callback){
		// add task to deploy contract
		localDB.getItem('deploy_tasks',(err, tasks)=>{
			if (!tasks) { tasks = [] }

			let task_id = code+'_'+tasks.length
			tasks.push({code:code, task_id:task_id })

			_games[code+'_'+tasks.length] = {
				code: code,
				task_id:task_id,
				deploying: true,
				start_balance:0,
				balance:0,
			}
			localDB.setItem('Games', _games)
			localDB.setItem('deploy_tasks', tasks)

			if (callback) { callback() }
		})

	}


	clearTasks(){
		localDB.setItem('deploy_tasks',[])
		localDB.getItem('Games',(err, games)=>{
			for(let k in games){
				if (games[k].deploying) {
					delete(games[k])
				};
			}
			localDB.setItem('Games', games)
		})
	}

	checkTasks(){
		localDB.getItem('deploy_tasks',(err, tasks)=>{
			if (!tasks || tasks.length==0) {
				setTimeout(()=>{ this.checkTasks() }, 5000)
				return
			}

			let game_code = tasks[0].code
			let task_id = tasks[0].task_id
			console.log('Start deploying: '+game_code+', task_id:'+task_id)

			Eth.deployContract(
				_config.contracts[game_code].bytecode,
				_config.contracts[game_code].gasprice,

				// Deployed!
				(address)=>{
					console.log(task_id+' - deployed')
					for(let k in _games){
						if (_games[k].task_id==task_id) {
							delete(_games[k])
							break
						}
					}
					this.add(game_code, address)

					// add bets to contract
					Api.addBets(address).then( result => {
						console.groupCollapsed('Add bets to '+address+' result:')
						console.log(result)
						console.groupEnd()
					})


					setTimeout(()=>{
						this.checkTasks()
					}, 1000)
				},

				// Pending
				()=>{
					tasks.shift()
					localDB.setItem('deploy_tasks', tasks)
				}
			)
		})
	}

	add(name, contract_id, callback){
		console.groupCollapsed('[Games] add ' + contract_id)

		this.getMeta(contract_id, (meta)=>{
			if (!_config.games[meta.code]) {
				return
			}

			_games[contract_id] = {
				game: name,
				meta: meta,
			}

			localDB.setItem('Games', _games)

			console.log('Get game balance')
			Eth.getBetsBalance(contract_id, (balance)=>{

				console.info('balance', balance)

				_games[contract_id].balance = balance
				if (!_games[contract_id].start_balance) {
					_games[contract_id].start_balance = balance
				}

				localDB.setItem('Games', _games)

				console.groupEnd()

				if (callback) callback()
			})
		})
	}

	remove(contract_id){
		delete(_games[contract_id])
		localDB.setItem('Games', _games)
	}

	runUpdateBalance(){
		this.get(games => {
			for(let contract_id in games){
				Eth.getBetsBalance(contract_id, (balance)=>{
					_games[contract_id].balance = balance
					localDB.setItem('Games', _games)
				})
			}
		})
	}

	checkBalances(){

	}

	runConfirm(){
		localDB.getItem('seeds_list', (err, seeds_list)=>{
			if (!err && seeds_list) {
				_seeds_list = seeds_list
			}

			this.get(games => {
				for(let address in games){
					if (games[address].deploying) {
						continue
					}

					this.getLogs(address, (r)=>{
						console.log('[UPD] Games.getLogs '+address+' res:',r)
					})
				}

				setTimeout(()=>{
					this.runConfirm()
				}, _config.confirm_timeout )
			})
		})
	}

	getMeta(address, callback){
		let meta = {
			version:0,
			code:'',
			name:'',
			link:'',
		}

		let getVar = function(varname, type, callback){
			return Eth.RPC.request('call', [{
				'to':   address,
				'data': '0x' + Eth.hashName(varname+'()')
			}, 'pending']).then( response => {

				if (type=='string') {
					return web3.toAscii(response.result)
							.replace(/\u0007/g, '')
							.replace(/\u0008/g, '')
							.replace(/\u0025/g, '')
							.replace(/\u0000/g, '')
							.trim()
				}
				return parseInt(response.result, 16)
			})
		}

		getVar('meta_version').then( version =>{
			meta.version = version

			return getVar('meta_code','string')
		}).then(code=>{
			meta.code = code

			return getVar('meta_name','string')
		}).then(name=>{
			meta.name = name
			console.log(encodeURIComponent(name))

			return getVar('meta_link','string')
		}).then(link=>{
			console.log(encodeURIComponent(link))
			meta.link = link
			callback(meta)
		})
	}

	getLogs(address, callback){
		if (!this._games[address] || !this._games[address].meta) {
			return
		}

		Api.getLogs(address, this._games[address].meta).then( seeds => {
			console.info('unconfirmed from server:'+seeds)
			if (seeds && seeds.length) {
				seeds.forEach( seed => {
					if (!_seeds_list[seed]) {
						_seeds_list[seed] = {
							contract:address
						}
					}
					this.sendRandom2Server(address, seed)
				})
			}
		})

		// Blockchain
		Eth.RPC.request('getLogs',[{
			'address':   address,
			'fromBlock': Eth.getCurBlock(),
			'toBlock':   'latest',
		}], 74).then( response => {
			if(!response.result){ callback(null); return }

			response.result.forEach(item => {

				Eth.setCurBlock(item.blockNumber)

				// let seed = item.data.substr(2)
				let seed = item.data
				if (!_seeds_list[seed]) {
					_seeds_list[seed] = { contract:address }
				}

				if (!_seeds_list[seed].confirm_sended_blockchain) {
					this.addTaskSendRandom(address, seed)
				}
			})

			callback(response.result)
			return
		})
	}


	addTaskSendRandom(address, seed, callback=false, repeat_on_error=3){
		let task = new AsyncTask({
			priority: 'low',
			callback:()=>{
				return new Promise((resolve, reject) => {
					try	{
						this.sendRandom(address, seed, (ok, result)=>{
							if (ok) {
								resolve( result )
							} else {
								reject( result )
							}
						})
					} catch(e){
						reject(e)
					}
				})
			},
		})

		task.promise.then(
			result => {
				if (callback) callback(result)
			},
			// Ошибка
			e => {
				if (repeat_on_error>0) {
					repeat_on_error--
					this.addTaskSendRandom(address, seed, callback, repeat_on_error)
				}
			}
		)

		this.Queue.enqueue(task)
	}

	checkPending(address, seed, callback){
		if (_seeds_list[seed].pending) {
			callback()
		}

		if (!_pendings_list[address+'_'+seed]) {
			_pendings_list[address+'_'+seed] = 0
		}

		_pendings_list[address+'_'+seed]++

		if (_pendings_list[address+'_'+seed] > 5) {
			return
		}

		Eth.RPC.request('call', [{
			'to':   address,
			'data': '0x' + Eth.hashName('listGames(bytes32)') + seed.substr(2)
		}, 'pending'], 0).then( response => {

			console.log(seed)
			console.log('>> Pending response:', response)

			if (!response.result || response.result.split('0').join('').length < 5) {
				_seeds_list[seed].pending = false
				return
			}

			_seeds_list[seed].pending = true
			delete( _pendings_list[address+'_'+seed] )
			callback()
		})
	}

	sendRandom2Server(address, seed){
		if (_seeds_list[seed] && _seeds_list[seed].confirm_sended_server) {
			return
		}

		// this.checkPending(address, seed, ()=>{
		this.getConfirmNumber(seed, address, _config.contracts.dice.abi, (confirm, PwDerivedKey)=>{

			Api.sendConfirm(address, seed, confirm).then(()=>{
				_seeds_list[seed].confirm_server_time   = new Date().getTime()
				_seeds_list[seed].confirm               = confirm
				_seeds_list[seed].confirm_server        = confirm
				_seeds_list[seed].confirm_sended_server = true

				localDB.setItem('seeds_list', _seeds_list)
			})
		})
		// })
	}

	sendRandom(address, seed, callback){
		if (_seeds_list[seed] && _seeds_list[seed].proccess_sended_blockchain ) {
			return
		}

		console.log('sendRandom', address, seed)

		_seeds_list[seed].proccess_sended_blockchain = true

		console.log('Eth.Wallet.getSignedTx')
		this.signTx(seed, address, _config.contracts.dice.abi, (signedTx, confirm)=>{

			console.log('getSignedTx result:', signedTx, confirm)

			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
				_seeds_list[seed].confirm_blockchain_time   = new Date().getTime()
				_seeds_list[seed].confirm_sended_blockchain = true
				_seeds_list[seed].confirm                   = confirm
				_seeds_list[seed].confirm_blockchain        = confirm

				localDB.setItem('seeds_list', _seeds_list, ()=>{
					callback(!!response.result, response)
				})
			}).catch( err => {
				console.error('sendRawTransaction error:', err)
			})

		})
	}

	signTx(seed, address, abi, callback){
		this.getConfirmNumber(seed, address, abi, (confirm, PwDerivedKey, v,r,s)=>{
			Eth.Wallet.getNonce( nonce => {
				console.log('nonce', nonce)
				let options = {
					to:       address,
					nonce:    nonce,
					gasPrice: '0x737be7600',
					gasLimit: '0x927c0',
					value:    0,
				}

				let registerTx = Eth.Wallet.lib.txutils.functionTx(
									abi,
									'confirm',
									[seed, v, r, s],
									options
								)

				let signedTx = Eth.Wallet.lib.signing.signTx(
									Eth.Wallet.getKs(),
									PwDerivedKey,
									registerTx,
									Eth.Wallet.get().openkey.substr(2)
								)

				callback(signedTx, confirm)
			})
		})
	}

}

export default new Games()
