var LogicJS = function (params={}) {
	var self     = this
	var _balance = params.balance || 0

	var _objSpeedGame = {
		result: false,
		rnd:    0,
		balance: _balance,
	}

	self.spin = function (_s, bet) {
		_objSpeedGame.result = false
		_objSpeedGame.rnd    = 0

		var hash = ABI.soliditySHA3(['bytes32'], [_s]).toString('hex')
		var iRandSpin = bigInt(hash, 16).divmod(100).remainder.value

		_objSpeedGame.rnd = iRandSpin

		var profit = -bet
		if (iRandSpin <= 50) {
			_objSpeedGame.result = true

			profit = bet
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
const game_code       = 'Slot'

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

		this.RTC = new Rtc(user_id)

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

			if (!data.game_id || data.user_id) { return }

			if (data.action=='call_game_function') {
				this.callGameFunction(data.user_id, data.game_id, data.name, data.args)
				return
			}

			if (data.action=='close_game_channel') {
				this.endGame(data)
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
	}

	endGame(params){
		if (!this.endGamesMsgs) { this.endGamesMsgs = {} }
		if (this.endGamesMsgs[params.seed]) { return }
		this.endGamesMsgs[params.seed] = true

		Games[params.user_id][params.game_id].channel = 'closing...'

		console.log('SLot endGame CHANNEL.CLOSE')
		console.log(params.address, params.account, params.profit)

		Channel.close(params.address, params.account, params.profit, res=>{
			params.action = 'game_channel_closed'
			params.result = true

			Games[params.user_id][params.game_id].channel = 'closed'

			this.RTC.sendMsg(params)
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
		this.RTC.sendMsg({
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
