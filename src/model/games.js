// @flow weak
import _config    from 'app.config'
import DB         from './DB/DB'
import Eth        from './Eth/Eth'
import Api        from './Api'
import Rtc        from './rtc'
import Notify     from './notify'

import bigInt     from 'big-integer'
import Web3       from 'web3'

const web3 = new Web3()

const web3_sha3 = require('web3/lib/utils/sha3.js')

import * as Utils from './utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'


let BJ = false
if (process.env.NODE_ENV !== 'server') {
	BJ = require('./games/BJ.js')
}

let Slots = false
if (process.env.NODE_ENV !== 'server') {
	Slots = require('./games/slots.js')
}


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

		if (BJ) {
			this.BJ = BJ.default
		}
		if (Slots) {
			this.Slots = Slots.default
		}
	}

	startMesh(){
		let user_id = Eth.Wallet.get().openkey || false
		this.RTC = new Rtc(user_id)

		DB.data.get('Games').map().on((game, game_id)=>{ if (game) {
			if (game.code=='daochannel_v1') {
				return
			}

			this.RTC.subscribe(game.contract_id, data => {
				if (!data || !data.action || !data.address) { return }
				// if (data.time && data.ttl && (data.time + data.ttl*1000) > new Date().getTime()) {
				// 	return
				// }


				if (data.seed && data.action == 'get_random') {
					this.sendRandom2Server(data.game_code, data.address, data.seed)
				}
			})
		}})

		setInterval(()=>{
			for(let k in _games){
				let game = _games[k]
				this.RTC.sendMsg({
					action:    'bankroller_active',
					game_code: game.code,
					address:   game.contract_id,
				})
			}
		}, 3500)
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
		Eth.getEthBalance(Eth.Wallet.get().openkey, eths => {
			if (eths < 0.5) {
				Notify.send('Please send some ETH to your account', 'insufficient funds')
			} else {
				let game_id = code+'_'+new Date().getTime()

				DB.data.get('Games').get(game_id).put({
					// game add to local DB, and waiting deploy contract
					need_deploy:   true,

					code:          code,
					start_balance: 0,
					balance:       0,
				})
			}
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

		if (game_to_deploy.code.indexOf('dice') != -1) {
			Eth.deployGameContract(
				_config.contracts.dice_v2.factory,

				// Deployed!
				(address)=>{
					this.add(game_to_deploy_id, game_to_deploy.code, address)

					// add bets to contract
					Api.addBets(address).then( result => {})

					Notify.send('Contract succefull deployed!', 'Address: '+address)
				},

				// Pending
				()=>{
					DB.data.get('Games').get(game_to_deploy_id).get('deploying').put(false)
				}
			)

			return
		}

		// Dice
		Eth.deployContract(
			_config.contracts[game_to_deploy.code].bytecode,
			_config.contracts[game_to_deploy.code].gasprice,

			// Deployed!
			(address)=>{
				this.add(game_to_deploy_id, game_to_deploy.code, address)

				// add bets to contract
				Api.addBets(address).then( result => {
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

			Eth.getBetsBalance(contract_id, (balance)=>{
				gamedb.get('balance').put(balance)
				gamedb.get('start_balance').put(balance)

				if (callback) callback()
			})
		})
	}

	// Remove game item from local database
	remove(game_id){
		if (_games[game_id].contract_id) {
			for(let k in _seeds_list){
				if (_seeds_list[k].contract==_games[game_id].contract_id) {
					delete(_seeds_list[k])
					DB.data.get('seeds_list').get(k).put(null)
				}
			}

			/* gunjs bugfix =) */ DB.data.get('seeds_list').map().on( (a,b)=>{ })

			// Return money
			this.withdraw( Object.assign({}, _games[game_id]) )
		}

		DB.data.get('Games').get(game_id).put(null)
		DB.data.get('deploy_tasks').get(game_id).put(null)
	}

	withdraw(game){
		Eth.getBetsBalance(game.contract_id, (balance)=>{

			Eth.Wallet.signedContractFuncTx(
				// game contract address and ABI
				game.contract_id, _config.contracts[game.meta_code].abi,
				// function adn params
				'withdraw', [balance*100000000],

				// result: transaction
				signedTx => {
					Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {

					})
				}
			)
		})
	}

	// [Cycle] Update contracts balances
	runUpdateBalance(){
		this.activeGames().forEach(game => {
			Eth.getBetsBalance(game.contract_id, (balance)=>{
				if (_games[game.id].start_balance==0) {
					_games[game.id].start_balance = balance
					DB.data.get('Games').get(game.id).get('start_balance').put(balance)
				} else {
					_games[game.id].balance = balance
					DB.data.get('Games').get(game.id).get('balance').put(balance)
				}
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

			return getVar('meta_link','string')
		}).then(link=>{
			meta.link = link
			callback(meta)
		})
	}


	/*
	 * Random
	 **/
	getConfirmNumber(game_code, seed, callback){
		Eth.Wallet.getPwDerivedKey( PwDerivedKey => {
			let msg = seed
			// let msg = '0x'+web3_sha3(seed)

			let VRS = Eth.Wallet.lib.signing.signMsgHash(
				Eth.Wallet.getKs(),
				PwDerivedKey,
				msg,
				Eth.Wallet.get().openkey
			)

			let signature = Eth.Wallet.lib.signing.concatSig(VRS)

			let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
			let r = signature.slice(0, 66)
			let s = '0x' + signature.slice(66, 130)

			let confirm = this.confirmNumber(game_code, s)

			callback(confirm, PwDerivedKey, msg,v,r,s)
		})
	}

	confirmNumber(game_code, input){
		if (game_code.indexOf('dice') != -1) {
			return this.confirmNumber_dice(input)
		}
		if (game_code.indexOf('blackjack') != -1 || game_code.indexOf('BJ') != -1) {
			return this.confirmNumber_blackjack(input)
		}
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
		return input
	}


	hasFunds(callback){
		Eth.getEthBalance(Eth.Wallet.get().openkey, eths => {
			if (eths < 0.01) {
				Notify.send('Please send some ETH to your account', 'insufficient funds')
				return
			}
			if (eths < 0.5) {
				Notify.send('Please send some ETH to your account', 'LOW BALANCE '+eths)
			}

			callback()
		})
	}

	/*
	 * Blockchain confirm
	 **/
	runBlockchainConfirm(){
		if (this.activeGames().length > 0) {
			this.hasFunds(()=>{
				this.activeGames().forEach(game => {
					if (game.balance > 0.5) {
						this.BlockchainConfirm(game.contract_id, game.meta_code)
					} else {
						Notify.send('Please send BETs to game contract', game.meta_name+' - LOW BALANCE')
					}
				})
			})
		}
		setTimeout(()=>{ this.runBlockchainConfirm() }, _config.confirm_timeout )
	}

	BlockchainConfirm(contract_id, game_code){
		if (game_code=='daochannel_v1') {
			return
		}

		// Get wait seeds list from contract logs
		this.getBlockchainLogs(contract_id, seeds => {

			// Add task in order - to send confirm in blockchain
			seeds.forEach(item => {
				Eth.setCurBlock(item.blockNumber)

				let seed = item.data
				if (this.isValidSeed(seed)) {
					if (!_seeds_list[seed]) {
						_seeds_list[seed] = { contract:contract_id }
					}

					if (!_seeds_list[seed].confirm_sended_blockchain) {
						this.addTaskSendRandom(game_code, contract_id, seed)
					}
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
		})
	}

	// Add send random task to queue
	addTaskSendRandom(game_code, address, seed, callback=false, repeat_on_error=7, priority='low'){
		let task = new AsyncTask({ priority: priority,
			callback:()=>{
				return new Promise((resolve, reject) => {

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
					this.addTaskSendRandom(address, seed, callback, repeat_on_error, 'high')
				}
			}
		)

		this.Queue.enqueue(task)
	}

	sendRandom2Blockchain(game_code, address, seed, callback){
		if (_seeds_list[seed] && _seeds_list[seed].proccess_sended_blockchain ) {
			return
		}

		_seeds_list[seed].proccess_sended_blockchain = true

		this.signConfirmTx(game_code, seed, address, _config.contracts[game_code].abi, (signedTx, confirm)=>{
			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {

				if (!response.result) {
					callback(false, response)
					return
				}

				_seeds_list[seed].tx                        = response.result
				_seeds_list[seed].confirm_blockchain_time   = new Date().getTime()
				_seeds_list[seed].confirm_sended_blockchain = true
				_seeds_list[seed].confirm                   = confirm
				_seeds_list[seed].confirm_blockchain        = confirm

				DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])

				callback(true, response)
			}).catch( err => {
				callback(false, err)
			})

		})
	}

	signConfirmTx(game_code, seed, address, abi, callback){
		this.getConfirmNumber(game_code, seed, (confirm, PwDerivedKey, msg,v,r,s)=>{

			// get signed transaction for confirm function
			Eth.Wallet.signedContractFuncTx(
				// game contract address and ABI
				address, abi,
				// function adn params
				'confirm', [msg, v, r, s],

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
		if (this.activeGames().length > 0) {
			this.hasFunds(()=>{
				this.activeGames().forEach(game => {
					if (!game || !game.contract_id) {
						return
					}

					if (game.balance > 0.5) {
						this.ServerConfirm(game.contract_id, game.meta_code, game.meta_version)
					}
				})
			})
		}

		setTimeout(()=>{ this.runServerConfirm() }, _config.confirm_timeout/2 )
	}

	ServerConfirm(contract_id, game_code, game_version){
		Api.getLogs(contract_id, game_code, game_version).then( seeds => {
			if (!seeds || !seeds.length) {
				return
			}

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


		this.checkPending(game_code, address, seed, ()=>{
			this.getConfirmNumber(game_code, seed, (confirm, PwDerivedKey)=>{

				if (this.RTC) {
					this.RTC.sendMsg({
						action:    'send_random',
						game_code: game_code,
						address:   address,
						seed:      seed,
						random:    confirm,
					})
				}

				Api.sendConfirm(address, seed, confirm).then(()=>{ })

				_seeds_list[seed].confirm_server_time   = new Date().getTime()
				_seeds_list[seed].confirm               = confirm
				_seeds_list[seed].confirm_server        = confirm
				_seeds_list[seed].confirm_sended_server = true

				DB.data.get('seeds_list').get(seed).put(_seeds_list[seed])
				/* gunjs bugfix =) */ DB.data.get('seeds_list').map().on( (a,b)=>{ })
			})
		})
	}

	checkPending(game_code, address, seed, callback){
		if (game_code.indexOf('blackjack')!=-1) {
			callback()
			return
		}
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
			if (!response.result){
				setTimeout(()=>{ this.checkPending(game_code, address, seed, callback) }, 1000)
				return
			}
			let resdata = response.result.split('0').join('')

			if (resdata.length < 5) {
				setTimeout(()=>{ this.checkPending(game_code, address, seed, callback) }, 1000)
				_seeds_list[seed].pending = false
				return
			}

			_seeds_list[seed].pending = true
			delete( _pendings_list[address+'_'+seed] )
			callback()
		})
	}

	isValidSeed(seed){
		return (seed.length==66)
	}


}

export default new Games()
