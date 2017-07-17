/**
 * Created by DAO.casino
 * Slot Macmhine
 * v 1.0.0
 */

var LogicJS = function (params) {
	var self = this
	var _balance = 0
	var _idGame = 0
	var _prnt
	var _callback

	if (params) {
		if (params.prnt) {
			_prnt = params.prnt
		}
		if (params.callback) {
			_callback = params.callback
		}
		_balance = params.balance || 0
	}


	var _objSpeedGame = {
		result:  '',
		rnd:     0,
		balance: 0,
	}

	self.spin = function (_s, bet) {
		_objSpeedGame.result = ''
		_objSpeedGame.rnd    = 0

		var hash      = ABI.soliditySHA3(['bytes32'], [_s]).toString('hex')
		var iRandSpin = bigInt(hash, 16).divmod(100).remainder.value

		_objSpeedGame.rnd = iRandSpin

		var profit = -bet
		if (iRandSpin <= 50) {
			_objSpeedGame.result = 'win'

			profit = bet
		} else {
			_objSpeedGame.result = 'loose'
		}

		_objSpeedGame.balance += profit

		return _objSpeedGame.rnd
	}

	self.getResult = function () {
		return _objSpeedGame
	}

	return self
}


import ABI        from 'ethereumjs-abi'
import bigInt     from 'big-integer'
import Eth        from '../Eth/Eth'
import Rtc        from '../rtc'
import * as Utils from '../utils'

import Channel from '../../Channel'

// const contractAddress = '0x89fe5E63487b2d45959502bEB1dac4d5A150663e'
const game_code = 'slot'

let Games = []

let seeds = []

export default class SlotGame {
	constructor(contractAddress) {
		this.contractAddress = contractAddress

		Eth.Wallet.getPwDerivedKey( PwDerivedKey => {
			this.PwDerivedKey = PwDerivedKey
		})

		this.Games = Games

		if (process.env.NODE_ENV !== 'server') {
			setTimeout(()=>{
				this.startMesh()
			}, 2000)
		}
	}

	startMesh(){
		let user_id = Eth.Wallet.get().openkey || false

		this.RTC = new Rtc(user_id, this.contractAddress)

		this.RTC.subscribe(this.contractAddress, data => {
			if (!data || !data.action || !data.game_code || data.game_code!=game_code) { return }
			console.log(data)
			if (seeds.indexOf(data.seed)>-1) {
				return
			};
			seeds.push(data.seed)


			if (data.action=='open_game_channel') {
				this.startGame(data)
				return
			}

			if (data.action=='get_random') {
				this.sendRandom(data)
				return
			}

			if (data.user_id && data.action=='close_game_channel') {
				this.endGame(data)
				return
			}

			if (data.game_id && data.action=='call_game_function') {
				this.callGameFunction(data.user_id, data.game_id, data.name, data.args)
				return
			}

		})
	}

	startGame(params){
		if (!params.user_id) {
			return
		}

		let game_id = params.game_id || 'start'
		let user_id = params.user_id

		if (!Games[user_id]) {
			Games[user_id] = {}
		}
		if (!Games[user_id][game_id]) {
			Games[user_id][game_id] = new LogicJS()
		}

		Games[user_id][game_id].channel = 'opened'
		Games[user_id][game_id].deposit = params.deposit
		Games[user_id][game_id].user_id = params.user_id
	}

	endGame(params){
		if (!this.endGamesMsgs) { this.endGamesMsgs = {} }
		if (this.endGamesMsgs[params.seed]) { return }
		this.endGamesMsgs[params.seed] = true

		let profit = 0
		for(let k in Games[params.user_id]){
			if (!Games[params.user_id][k]) {
				continue
			}

			Games[params.user_id][k].channel = 'closing...'
			profit += Games[params.user_id][k].getResult().balance
		}


		console.log('SLot endGame CHANNEL.CLOSE')
		console.log(params.address, params.account, params.profit)
		console.log('user profit', params.profit)
		console.log('bankroll profit', profit)

		// if (profit==params.profit) {

		// }

		Channel.close(params.address, params.account, profit, res=>{
			params.action = 'game_channel_closed'
			params.result = true

			for(let k in Games[params.user_id]){
				Games[params.user_id][k].channel = 'closed'
			}

			this.RTC.send(params)
		})
	}

	callGameFunction(user_id, game_id, function_name, function_args){
		console.log(game_id, function_name, function_args)
		if (!Games[user_id]) {
			Games[user_id] = {}
		}
		if (Games[user_id]['start']) {
			Games[user_id][game_id] = Games[user_id]['start']
			delete(Games[user_id]['start'])
		};
		if (!Games[user_id][game_id]) {
			Games[user_id][game_id] = new LogicJS()
		}

		if (!Games[user_id][game_id][function_name]) {
			return
		}

		function_args = this.prepareArgs(function_args)

		if (function_args) {
			Games[user_id][game_id][function_name].apply(null, function_args)
		} else {
			Games[user_id][game_id][function_name]()
		}

		Games[user_id][game_id].user_id = user_id
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
		this.RTC.send({
			action:    'send_random',
			game_code: 'daochannel_v1',
			address:   this.contractAddress,
			seed:      data.seed,
			random:    this.confirm(data.seed),
		})
	}

	confirm(seed){
		let VRS = Eth.Wallet.lib.signing.signMsg(
			Eth.Wallet.getKs(),
			this.PwDerivedKey,
			seed,
			Eth.Wallet.get().openkey
		)

		let signature = Eth.Wallet.lib.signing.concatSig(VRS)

		// let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
		// let r = signature.slice(0, 66)
		// let s = '0x' + signature.slice(66, 130)

		return signature
	}
}
