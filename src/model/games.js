import _config    from 'app.config'
import DB         from './DB/DB'
import Eth        from './Eth/Eth'
import Api        from './Api'
import Notify     from './notify'

import bigInt     from 'big-integer'
import Web3       from 'web3'

const web3 = new Web3()

import * as Utils from './utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

let _games         = {}
let _seeds_list    = {}
let _pendings_list = {}

class Games {
	constructor(){
		this.Queue = new AsyncPriorityQueue({
			debug:               false,
			maxParallel:         1,
			processingFrequency: 500,
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

	activeGames(){
		let active_games = []
		for(let game_id in _games){
			if (!_games[game_id] || !_games[game_id].contract_id || _games[game_id].deploying) {
				continue
			}
			_games[game_id].id    = game_id
			active_games.push(_games[game_id])
		}
		return active_games
	}

	// Add task - deploy game
	create(code){
		let game_id = code+'_'+new Date().getTime()

		DB.data.get('Games').get(game_id).put({
			// game add to local DB, and waiting deploy contract
			need_deploy:   true,

			code:          code,
			start_balance: 0,
			balance:       0,
		})
	}

	// check games waiting deploy
	checkDeployTasks(){
		// Deploy ONE game for cycle
		let game_to_deploy_id = false, game_to_deploy = false
		for(let game_id in _games){
			let game = _games[game_id]

			if (!game || !game.need_deploy) { continue }

			game_to_deploy_id = game_id
			game_to_deploy    = game
			break
		} // for(let game_id in _games){

		// Next check
		if (!game_to_deploy) {
			setTimeout(()=>{ this.checkDeployTasks() }, 5000 )
			return
		}
		setTimeout(()=>{ this.checkDeployTasks() }, 15000 )

		// Start deploy new game contract
		_games[game_to_deploy_id].need_deploy = false
		DB.data.get('Games').get(game_to_deploy_id).get('need_deploy').put(false)
		DB.data.get('Games').get(game_to_deploy_id).get('deploying').put(true)

		Eth.deployContract(
			_config.contracts[game_to_deploy.code].bytecode,
			_config.contracts[game_to_deploy.code].gasprice,

			// Deployed!
			(address)=>{
				console.log(game_to_deploy_id+' - deployed')

				this.add(game_to_deploy_id, game_to_deploy.code, address)

				// add bets to contract
				Api.addBets(address).then( result => {
					console.log('Add bets to '+address+' result:')
					console.log(result)
				})

				Notify.send('Contract succefull deployed!', 'Address: '+address)
			},

			// Pending
			()=>{
				DB.data.get('Games').get(game_to_deploy_id).get('deploying').put(false)
			}
		)
	}

	// Add deployed contract
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

			Notify.send('Game added!', 'Game '+meta.name+' succefull add')

			console.log('Get game balance')
			Eth.getBetsBalance(contract_id, (balance)=>{
				console.log('balance', balance)
				gamedb.get('balance').put(balance)
				gamedb.get('start_balance').put(balance)



				if (callback) callback()
			})
		})
	}

	// Remove game item from local database
	remove(game_id){
		console.log('remove game_id',game_id)
		DB.data.get('Games').get(game_id).put(null)
		DB.data.get('deploy_tasks').get(game_id).put(null)
	}


	// [Cycle] Update contracts balances
	runUpdateBalance(){
		this.activeGames().forEach(game => {
			// console.log(' > getBetsBalance contract_id: '+game.contract_id)
			Eth.getBetsBalance(game.contract_id, (balance)=>{
				// console.log('balance:'+balance)
				DB.data.get('Games').get(game.id).get('balance').put(balance)
			})
		})

		let update_time = this.activeGames().length * 15 * 1000
		if (update_time <= 0) {
			update_time = 60*1000
		}
		setTimeout(()=>{ this.runUpdateBalance() }, update_time)
	}

	// Get contract metadata
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


	/*
	 * Random
	 **/
	getConfirmNumber(seed, callback){
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

			let confirm

			confirm = this.confirmNumber_dice(s)

			callback(confirm, PwDerivedKey, v,r,s)
		})
	}
	confirmNumber_dice(input){
		/* Equivalent of solidity hash function:
			function confirm(bytes32 _s) public returns(uint256){
				return uint256 (sha3(_s));
			}
		*/
		let    hash    = '0x'+Eth.ABI.soliditySHA3(['bytes32'],[ input ]).toString('hex')
		let    confirm = bigInt(hash,16).divmod(65536).remainder.value
		return confirm
	}
	confirmNumber_blackjack(input){
		//     this.testSHA("0x14963965039618f89a0d8a00af57fe504dc40e2dc241276b065abb83636d14d0")
		let    hash    = Eth.ABI.soliditySHA3(['bytes32'],[ input ]).toString('hex')
		let    confirm = bigInt(hash,16).divmod(52).remainder.value
		return confirm
	}




	/*
	 * Blockchain confirm
	 **/
	runBlockchainConfirm(){
		this.activeGames().forEach(game => {
			this.BlockchainConfirm(game.contract_id, game.meta_code)
		})

		setTimeout(()=>{ this.runBlockchainConfirm() }, _config.confirm_timeout )
	}
	BlockchainConfirm(contract_id, game_code){
		// Get wait seeds list from contract logs
		this.getBlockchainLogs(contract_id, seeds => {
			// console.log('unconfirmed from blockchain:', seeds.length)

			// Add task in order - to send confirm in blockchain
			seeds.forEach(item => {
				Eth.setCurBlock(item.blockNumber)

				let seed = item.data
				if (!_seeds_list[seed]) {
					_seeds_list[seed] = { contract:address }
				}

				if (!_seeds_list[seed].confirm_sended_blockchain) {
					this.addTaskSendRandom(game_code, contract_id, seed)
				}
			})
		})
	}

	getBlockchainLogs(contract_id, callback){
		if (!contract_id) { return }

		// Blockchain
		Eth.RPC.request('getLogs',[{
			'address':   contract_id,
			'fromBlock': Eth.getCurBlock(),
			'toBlock':   'latest',
		}], 74).then( response => {
			if(!response || !response.result){ callback([]); return }

			if (callback) callback(response.result)
		}).catch(err => {
			// console.log('Blockchain getLogs: empty')
		})
	}

	// Add send random task to queue
	addTaskSendRandom(game_code, address, seed, callback=false, repeat_on_error=3){
		console.log('')
		console.log('>> addTaskSendRandom')
		console.log('')

		let task = new AsyncTask({ priority: 'low',
			callback:()=>{
				return new Promise((resolve, reject) => {
					console.log('')
					console.log('>> sendRandom2Blockchain')
					console.log('')
					this.sendRandom2Blockchain(game_code, address, seed, (ok, result)=>{
						if (ok) {
							resolve( result )
						} else {
							reject( result )
						}
					})
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

	sendRandom2Blockchain(game_code, address, seed, callback){
		if (_seeds_list[seed] && _seeds_list[seed].proccess_sended_blockchain ) {
			console.log('sendRandom2Blockchain - ALLREADY SENDED')
			return
		}

		console.log('sendRandom2Blockchain - PROCCESS')

		_seeds_list[seed].proccess_sended_blockchain = true

		console.log('')
		console.log('sendRandom2Blockchain', _seeds_list[seed])

		this.signConfirmTx(seed, address, _config.contracts[game_code].abi, (signedTx, confirm)=>{

			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
				_seeds_list[seed].confirm_blockchain_time   = new Date().getTime()
				_seeds_list[seed].confirm_sended_blockchain = true
				_seeds_list[seed].confirm                   = confirm
				_seeds_list[seed].confirm_blockchain        = confirm

				DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])

				callback(true, response)
			}).catch( err => {
				callback(false, err)
				console.error('CONFIRM ERROR:', err)
			})

		})
	}

	signConfirmTx(seed, address, abi, callback){
		this.getConfirmNumber(seed, (confirm, PwDerivedKey, v,r,s)=>{

			// get signed transaction for confirm function
			Eth.Wallet.signedContractFuncTx(
				// game contract address and ABI
				address, abi,
				// function adn params
				'confirm', [seed, v, r, s],

				// result: transaction
				signedTx => {
					callback(signedTx, confirm)
				}
			)
		})
	}


	/*
	 * Server confirm
	 **/
	runServerConfirm(){
		this.activeGames().forEach(game => {
			this.ServerConfirm(game.contract_id, game.meta_code, game.meta_version)
		})
		setTimeout(()=>{ this.runServerConfirm() }, _config.confirm_timeout/2 )
	}

	ServerConfirm(contract_id, game_code, game_version){
		Api.getLogs(contract_id, game_code, game_version).then( seeds => {
			if (!seeds || !seeds.length) {
				return
			}

			// console.info('Unconfirmed from server:', seeds.length )

			seeds.forEach( seed => {
				this.sendRandom2Server(game_code, contract_id, seed)
			})
		})
	}

	sendRandom2Server(game_code, address, seed){
		if (!_seeds_list[seed]) {
			_seeds_list[seed] = {
				contract:address,
			}

			DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
		}

		if (_seeds_list[seed] && _seeds_list[seed].confirm_sended_server) {
			return
		}

		this.checkPending(address, seed, ()=>{
			this.getConfirmNumber(seed, (confirm, PwDerivedKey)=>{
				console.log('')
				console.log('Confirm number: ' + confirm)
				console.log('')
				Api.sendConfirm(address, seed, confirm).then(()=>{
					_seeds_list[seed].confirm_server_time   = new Date().getTime()
					_seeds_list[seed].confirm               = confirm
					_seeds_list[seed].confirm_server        = confirm
					_seeds_list[seed].confirm_sended_server = true

					DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
				})
			})
		})
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

			// console.log(' ')
			// console.log('>> check seed: '+seed)
			// console.log('>> Pending response:', resdata+'...')

			if (resdata.length < 5) {
				_seeds_list[seed].pending = false
				return
			}

			_seeds_list[seed].pending = true
			delete( _pendings_list[address+'_'+seed] )
			callback()
		})
	}


}

export default new Games()
