// @flow weak
import _config    from 'app.config'
import DB         from './DB/DB'
import Eth        from './Eth/Eth'
import Api        from './Api'
import Rtc        from './rtc'
import Notify     from './notify'
import GamesStat  from './games.stat.js'

import bigInt     from 'big-integer'

const web3Utils = require('web3/packages/web3-utils')

import * as Utils from './utils'

if (window) {
	window.GamesStat = GamesStat
}

let _games         = {}
let _gamesLogic    = {}


class Games {
	constructor(){
		this.subscribe('Games').on( (game, game_id) => {
			if (!game || !game_id) { return }
			_games[ game_id ] = game
		})
	}

	startChannelsGames(){
		for(let k in _games){
			let game = _games[k]
			if (!_gamesLogic[game.code] && (_config.games[game.code] && _config.games[game.code].channels)) {
				const gameLogic = require('./games/'+game.code+'.js').default
				_gamesLogic[game.code] = new gameLogic(game.contract_id)
			}
		}

		this.BJ    = _gamesLogic['BJ']
		this.BJ_m  = _gamesLogic['BJ_m']
		this.Slots = _gamesLogic['slot']

		setTimeout(()=>{
			this.startChannelsGames()
		}, 10000)
	}

	startMesh(){
		let user_id = Eth.Wallet.get().openkey || false
		this.RTC = new Rtc(user_id)

		DB.data.get('Games').map().on((game, game_id)=>{ if (game) {

			GamesStat.add(game.contract_id, 'game', game)

			if (_config.games[game.code] && _config.games[game.code].channels) {
				return
			}

			this.RTC.subscribe(game.contract_id, data => {
				if (!data || !data.action || !data.address) { return }

				if (data.seed && data.action == 'get_random') {
					this.sendRandom2Server(data.game_code, data.address, data.seed)
				}
			})
		}})

		setInterval(()=>{
			Object.values(_games).forEach(game=>{
				this.RTC.sendMsg({
					action    : 'bankroller_active',
					game_code : game.code,
					address   : game.contract_id,
					stat      : GamesStat.info(game.contract_id)
				})
			})


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


		// Deploy channel
		if (_config.games[game_to_deploy.code].channels) {
			Eth.deployChannelContract(
				_config.contracts[game_to_deploy.code].factory,

				// Deployed!
				(address)=>{
					this.add(game_to_deploy_id, game_to_deploy.code, address)

					// add bets to contract
					Api.addBets(address)

					Notify.send('Contract succefull deployed!', 'Address: '+address)
				},

				// Pending
				()=>{
					DB.data.get('Games').get(game_to_deploy_id).get('deploying').put(false)
				}
			)

			return
		}

		if (game_to_deploy.code.indexOf('dice') != -1) {
			Eth.deployGameContract(
				_config.contracts.dice_v2.factory,

				// Deployed!
				(address)=>{
					this.add(game_to_deploy_id, game_to_deploy.code, address)

					// add bets to contract
					Api.addBets(address)

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
				Api.addBets(address)
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
					return web3Utils.toAscii(response.result)
						.replace(/\)/g, '')
						.replace(/\(/g, '')
						.replace(/\/g, '')
						.replace(/\/g, '')
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

}

export default new Games()
