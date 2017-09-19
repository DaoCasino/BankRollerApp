/**
 * Created by DAO.casino
 * BlackJack
 * v 1.0.12
 */
var GameRoom = function(user_id){
	var _self = this

	var playersRandoms = {}
	var Players        = {}
	var cur_player     = 0

	_self.user_id = user_id

	var Player = function(user_id){
		this.user_id = user_id

		this.order = Object.keys(Players).length

		this.send_rand = 0

		this.randNum = function(){
			this.send_rand++
			return Math.ceil( Math.random()*100 )
		}

		return this
	}

	_self.newPlayer = function(user_id){
		Players[user_id] = new Player(user_id)
	}

	_self.randNum = function(user_id, callback){
		playersRandoms[user_id] = Players[user_id].randNum()

		cur_player++
		if (cur_player >  Object.keys(Players).length-1) {
			cur_player = 0
		}

		console.log('Current player:',cur_player )

		if (Object.keys(Players).sort().join('||') == Object.keys(playersRandoms).sort().join('||')) {
			_self.result()
		}

		if(callback) callback( playersRandoms[user_id] )
	}

	_self.result = function(){
		var winner_res = Object.values( playersRandoms ).sort().reverse()[0]

		var winner = false
		var max = 0
		for(var user_id in playersRandoms){
			if (playersRandoms[user_id] > max) {
				max = playersRandoms[user_id]
				winner = user_id
			}
		}

		return winner
	}

	_self.myStep = function(){
		return cur_player == Players[_self.user_id].order
	}

	_self.Players    = Players
	_self.cur_player = cur_player

	return _self
}







const game_code = 'MG'
const max_players = 3

import ABI        from 'ethereumjs-abi'
import bigInt     from 'big-integer'
import Eth        from 'Eth/Eth'
import Rtc        from 'rtc'
import Channel    from 'Channel'
import GamesStat  from 'games.stat.js'

import * as Utils from 'utils'



let Games = []
let _closing_channels = []

export default class MGgame {
	constructor(contractAddress=false) {
		if (!contractAddress) {
			return false
		}

		this.contractAddress = contractAddress

		Eth.Wallet.getPwDerivedKey( PwDerivedKey => {
			this.PwDerivedKey = PwDerivedKey
		})

		this.Games = Games

		if (process.env.NODE_ENV !== 'server') {
			setTimeout(()=>{
				this.startMesh()
			}, 3000)
		}
	}

	startMesh(){
		let user_id = Eth.Wallet.get().openkey || false

		console.log('new RTC', user_id, this.contractAddress)

		this.RTC = new Rtc(user_id, this.contractAddress)

		this.RTC.subscribe(this.contractAddress, data => {
			if (!data || !data.action || !data.game_code || data.game_code!=game_code) { return }
			if (data.action=='you_are_ready') return

			console.log(data)

			if (data.action=='get_random') {
				this.sendRandom(data)
				return
			}

			if (data.action=='open_game_channel') {
				this.startGame(data)
				return
			}
			if (data.action=='close_game_channel') {
				this.endGame(data)
				return
			}


			if (!data.game_hash || !data.user_id) { return }

			if (data.action=='call_game_function') {
				this.callGameFunction(data.user_id, data.game_hash, data.name, data.args)
			}
		})
	}

	addUser2Game(game_hash, user_id, params){
		let g = Games[game_hash]
		g.users[user_id] = {}

		g.users[user_id].channel = 'opened'
		g.users[user_id].deposit = params.deposit
		g.users[user_id].user_id = params.user_id

		g.room.newPlayer( user_id )

		GamesStat.add(this.contractAddress, 'players_now', Object.keys(g.users).length)
	}

	startGame(params){
		if (!params.user_id) {
			return
		}
		let user_id   = params.user_id
		let game_hash = params.game_hash || Utils.makeSeed()

		// find existing game for user
		for(let hash in Games){
			console.log(Games[hash].users)
			if (Object.keys(Games[hash].users).length < max_players) {
				this.addUser2Game(hash, user_id, params)
				Games[game_hash] = Games[hash]
				console.log('user connect to game')

				this.RTC.send({
					action:         'user_connected',
					game_code:      game_code,
					game_hash:      game_hash,
					address:        this.contractAddress,
					connected_user: user_id,
				})

				return
			}
		}

		// Creat new game
		console.log('Create new game')

		Games[game_hash] = {
			room       : new GameRoom(),
			start_user : user_id,
			users      : {}
		}

		this.addUser2Game(game_hash, user_id, params)

		GamesStat.cnt(this.contractAddress, 'open_game')

		game_hash
		this.RTC.send({
			action: 'game_hash',
			seed:   params.seed,
		})

	}


	endGame(params){
		console.log('endGame - DISABLED'); return

		if (!this.endGamesMsgs) { this.endGamesMsgs = {} }

		if (this.endGamesMsgs[params.seed]) { return }
		this.endGamesMsgs[params.seed] = true

		let user_id = params.user_id


		let close_code = ''

		let profit = 0
		for(let k in Games[user_id]){
			if (['closed','closing...'].indexOf(Games[user_id][k].channel) > -1 ) {
				continue
			}
			profit += Games[user_id][k].getResult().profit
			Games[user_id][k].channel = 'closing...'
			close_code += user_id+'_'+k+'_'
		}
		// delete(Games[user_id])

		console.log('bankroll profit', profit)
		console.log('user profit', params.profit)

		params.action = 'game_channel_closed'

		if (params.profit == profit) {
			profit = profit/100000000

			if (!(profit < 0)) {
				GamesStat.cnt(this.contractAddress, 'wins' )
				GamesStat.cnt(this.contractAddress, 'win_bets', Math.abs(profit) )
			}
			if (profit < 0) {
				GamesStat.cnt(this.contractAddress, 'lose')
				GamesStat.cnt(this.contractAddress, 'lose_bets', Math.abs(profit) )
			}


			close_code += params.address+'_'+params.account+'_'+profit
			if (_closing_channels.indexOf(close_code) > -1) {
				console.log('channel allready closing ', close_code)
				return
			}
			_closing_channels.push(close_code)


			console.log('Channel.close', {profit:profit}, params)
			Channel.close(params.address, params.account, params.channel_id, profit, res => {
				console.log(res)
				params.result = true

				for(let k in Games[user_id]){
					Games[user_id][k].channel = 'closed'
				}

				GamesStat.cnt(this.contractAddress, 'close_game')

				console.log('rtc send', params)
				this.RTC.send(params)
			})
			return
		}

		params.result = {
			error  : 'invalid_profit',
			profit : profit
		}
		this.RTC.send(params)
	}

	callGameFunction(user_id, game_hash, function_name, function_args){
		// console.log(game_id, function_name, function_args)
		if (!Games[game_hash]) {
			return
		}

		let G = Games[game_hash].room


		if (!G[function_name]) {
			return
		}

		function_args = this.prepareArgs(function_args)

		if (function_args) {
			G[function_name].apply(null, function_args)
		} else {
			G[function_name]()
		}

	}

	prepareArgs(args){
		if (!args || !args.length) {
			return false
		}

		let new_args = []
		args.forEach( arg => {
			if (arg && (''+arg).indexOf('confirm')!=-1) {
				let seed = arg.split('confirm(')[1].split(')')[0]
				arg = this.confirm(seed)
			}
			new_args.push(arg)
		})
		return new_args
	}

	sendRandom(data){
		if (!data.seed) {
			return
		}

		this.RTC.send({
			action:    'send_random',
			game_code: game_code,
			address:   this.contractAddress,
			seed:      data.seed,
			random:    this.confirm(data.seed),
		})
	}

	confirm(rawMsg=false){
		if (!rawMsg) {
			return
		}

		// let VRS = Eth.Wallet.lib.signing.signMsgHash(
		let VRS = Eth.Wallet.lib.signing.signMsg(
			Eth.Wallet.getKs(),
			this.PwDerivedKey,
			rawMsg,
			Eth.Wallet.get().openkey
		)

		let signature = Eth.Wallet.lib.signing.concatSig(VRS)

		return signature
	}
}
