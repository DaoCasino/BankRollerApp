import _config    from 'app.config'
import DB         from 'DB/DB'
import Eth        from 'Eth/Eth'
import Api        from 'Api'
import bigInt     from 'big-integer'
import Web3       from 'web3'

const web3 = new Web3()

import * as Utils from 'utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

let _games         = {}
let _seeds_list    = {}
let _pendings_list = {}


class Games {
	constructor(){
		this.Queue = new AsyncPriorityQueue({
			debug:               false,
			maxParallel:         1,
			processingFrequency: 350,
		})

		this.Queue.start()

		this.subscribe('Games').on( (game, game_id) => {
			if (!game || !game_id) { return }
			_games[ game_id ] = game
		})
	}

	// Subscribe to data changes
	subscribe(key){
		return DB.data.get(key).map()
	}

	get(){
		return _games
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

	create(code){
		let game_id = code+'_'+new Date().getTime()

		DB.data.get('Games').get(game_id).put({
			need_deploy:   true,
			code:          code,
			start_balance: 0,
			balance:       0,
		})
	}


	checkTasks(){
		this.subscribe('Games').val( (game, game_id) => {
			if (!game || !game.need_deploy) { return }

			DB.data.get('Games').get(game_id).get('need_deploy').put(false)
			DB.data.get('Games').get(game_id).get('deploying').put(true)

			console.log('Start deploy '+game_id)

			Eth.deployContract(
				_config.contracts[game.code].bytecode,
				_config.contracts[game.code].gasprice,

				// Deployed!
				(address)=>{
					console.log(game_id+' - deployed')

					this.add(game_id, game.code, address)

					// add bets to contract
					Api.addBets(address).then( result => {
						console.log('Add bets to '+address+' result:')
						console.log(result)

					})
				},

				// Pending
				()=>{
					DB.data.get('Games').get(game_id).get('deploying').put(false)
				}
			)
		})
	}

	add(game_id, name, contract_id, callback){
		console.log('[Games] add ' + contract_id)

		if (!game_id) {
			game_id = name+'_'+contract_id
		}

		let gamedb = DB.data.get('Games').get(game_id)

		gamedb.get('contract_id').put(contract_id)

		this.getMeta(contract_id, (meta)=>{
			if (!_config.games[meta.code]) {
				return
			}

			gamedb.get('game').put(meta.code)
			gamedb.get('meta_link').put(meta.link)
			gamedb.get('meta_code').put(meta.code)
			gamedb.get('meta_version').put(meta.version)
			gamedb.get('meta_name').put(meta.name)

			console.log('Get game balance')

			Eth.getBetsBalance(contract_id, (balance)=>{
				console.log('balance', balance)
				gamedb.get('balance').put(balance)
				gamedb.get('start_balance').put(balance)



				if (callback) callback()
			})
		})
	}

	remove(game_id){
		console.log('remove game_id',game_id)
		DB.data.get('Games').get(game_id).put(null)
		DB.data.get('deploy_tasks').get(game_id).put(null)
	}

	runUpdateBalance(){
		for(let game_id in _games){
			if (!_games[game_id] || !_games[game_id].contract_id) {
				continue
			}
			console.log(' > getBetsBalance contract_id: '+_games[game_id].contract_id)
			Eth.getBetsBalance(_games[game_id].contract_id, (balance)=>{
				console.log('balance:'+balance)
				DB.data.get('Games').get(game_id).get('balance').put(balance)
			})
		}


		let update_time = Object.keys(_games).length * 15 * 1000
		if (update_time <= 0) {
			update_time = 60*1000
		}
		setTimeout(()=>{
			this.runUpdateBalance()
		}, update_time)
	}

	runConfirmT(){
		clearTimeout(this.runConfirm_timeout )
		this.runConfirm_timeout = setTimeout(()=>{
			this.runConfirm()
		}, _config.confirm_timeout )
	}
	runConfirm(){
		this.subscribe('Games').val( (game, game_id)=>{
			if (!game || !game.contract_id || game.deploying) {
				this.runConfirmT()
				return
			}

			this.getLogs(game.contract_id, game.meta_code, game.meta_version, r => {
				console.log('getLogs for '+game.contract_id+' res length:', r.length)

				this.runConfirmT()
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
				if (!response || !response.result) {
					return
				}
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

	getLogs(address, game_code, game_version, callback){
		if (!address || !game_code || !game_version) { return }

		Api.getLogs(address, game_code, game_version).then( seeds => {
			if (!seeds) { return }
			console.info('unconfirmed from server:', seeds.length )
			if (seeds && seeds.length) {
				seeds.forEach( seed => {
					if (!_seeds_list[seed]) {
						_seeds_list[seed] = {
							contract:address,
						}

						DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
					}
					this.sendRandom2Server(game_code, address, seed)
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

				let seed = item.data
				if (!_seeds_list[seed]) {
					_seeds_list[seed] = { contract:address }
				}

				if (!_seeds_list[seed].confirm_sended_blockchain) {
					this.addTaskSendRandom(game_code, address, seed)
				}
			})

			callback(response.result)
			return
		})
	}


	addTaskSendRandom(game_code, address, seed, callback=false, repeat_on_error=3){
		let task = new AsyncTask({
			priority: 'low',
			callback:()=>{
				return new Promise((resolve, reject) => {
					try	{
						this.sendRandom(game_code, address, seed, (ok, result)=>{
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

		if (_pendings_list[address+'_'+seed] > 30) {
			DB.data.get('seeds_list').get(seed).put(null)
			return
		}

		Eth.RPC.request('call', [{
			'to':   address,
			'data': '0x' + Eth.hashName('listGames(bytes32)') + seed.substr(2)
		}, 'pending'], 0).then( response => {
			if (!response.result){ return }
			let resdata = response.result.split('0').join('')

			console.log(' ')
			console.log('>> check seed: '+seed)
			console.log('>> Pending response:', resdata+'...')

			if (resdata.length < 5) {
				_seeds_list[seed].pending = false
				return
			}

			_seeds_list[seed].pending = true
			delete( _pendings_list[address+'_'+seed] )
			callback()
		})
	}

	sendRandom2Server(game_code, address, seed){
		if (_seeds_list[seed] && _seeds_list[seed].confirm_sended_server) {
			return
		}

		this.checkPending(address, seed, ()=>{
			this.getConfirmNumber(seed, address, _config.contracts[game_code].abi, (confirm, PwDerivedKey)=>{
				console.log('')
				console.log('Confirm number: ' + confirm)
				console.log('')
				Api.sendConfirm(address, seed, confirm).then(()=>{
					_seeds_list[seed].confirm_server_time   = new Date().getTime()
					_seeds_list[seed].confirm               = confirm
					_seeds_list[seed].confirm_server        = confirm
					_seeds_list[seed].confirm_sended_server = true

					DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
					DB.data.get('seeds_list').map().val((v, k)=>{
						console.log('seed:'+k)
					})
				})
			})
		})
	}

	sendRandom(game_code, address, seed, callback){
		if (_seeds_list[seed] && _seeds_list[seed].proccess_sended_blockchain ) {
			return
		}

		console.log('sendRandom', address, seed)

		_seeds_list[seed].proccess_sended_blockchain = true

		console.log('Eth.Wallet.getSignedTx')

		console.log('sendRandom',game_code)
		this.signTx(seed, address, _config.contracts[game_code].abi, (signedTx, confirm)=>{

			console.log('getSignedTx result:', signedTx, confirm)

			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
				_seeds_list[seed].confirm_blockchain_time   = new Date().getTime()
				_seeds_list[seed].confirm_sended_blockchain = true
				_seeds_list[seed].confirm                   = confirm
				_seeds_list[seed].confirm_blockchain        = confirm

				DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
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
