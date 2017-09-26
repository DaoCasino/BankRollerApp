const GameLogic = function(deposit){
	var balance = deposit*1
	var history = []

	var roll = function(user_bet, user_num, random_hash){
		let profit = -user_bet
		console.log(random_hash)


		if (random_hash.substr(0,2)=='0x') {
			random_hash = random_hash.substr(2)
		}

		const random_num = bigInt(random_hash, 16).divmod(65536).remainder.value

		if (user_num > random_num) {
			profit = (user_bet * (65536 - 1310) / user_num) - user_bet
		}
		if (user_num == random_num) {
			profit = user_bet
		}

		balance += profit

		const roll_item = {
			timestamp   : new Date().getTime(),
			user_bet    : user_bet,
			profit      : profit,
			user_num    : user_num,
			balance     : balance,
			random_hash : random_hash,
			random_num  : random_num,
		}


		history.push(roll_item)

		return roll_item
	}

	return {
		history: history,
		roll:    roll,
		balance: function(){ return balance },
	}
}


// @flow weak
import _config    from 'app.config'
import DB         from './DB/DB'
import Eth        from './Eth/Eth'
import Api        from './Api'
import Rtc        from './rtc'

import bigInt     from 'big-integer'


const WEB3 = require('web3/packages/web3')
const web3 = new WEB3()

import * as Utils from './utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

const contract = {
	address : '0xd7aa363a70866e6cf1f82089e4e2ec9a83c51c6a',
	abi     :  JSON.parse('[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"disputes","outputs":[{"name":"seed","type":"bytes32"},{"name":"chance","type":"uint256"},{"name":"bet","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"closeByConsent","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"sigseed","type":"bytes"}],"name":"closeDispute","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"seed","type":"bytes32"},{"name":"nonce","type":"uint256"},{"name":"bet","type":"uint256"},{"name":"chance","type":"uint256"}],"name":"openDispute","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"player","type":"address"},{"name":"playerDeposit","type":"uint256"},{"name":"bankrollDeposit","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"time","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"open","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"update","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"channels","outputs":[{"name":"player","type":"address"},{"name":"bankroller","type":"address"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"endBlock","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"seed","type":"bytes32"},{"name":"nonce","type":"uint256"},{"name":"bet","type":"uint256"},{"name":"chance","type":"uint256"},{"name":"sig","type":"bytes"},{"name":"sigseed","type":"bytes"}],"name":"updateGameState","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"}],"name":"closeByTime","outputs":[],"payable":false,"type":"function"}]')
}
const game_code = 'dice_gamechannel'
const rtc_room  = 'game_channel_'+game_code

const Games     = {}
const _channels = {}

class DiceGameChannel {
	constructor(){
		this.Games = Games

		this.setGameContract(contract.address, ()=>{
			this.startMesh()
		})
	}

	startMesh(){
		this.RTC = new Rtc( (Eth.Wallet.get().openkey || false) , rtc_room )

		this.iamActive()


		this.RTC.subscribe(contract.address, data => {
			if (!data || !data.action || !data.game_code || data.game_code!=game_code) { return }


			if (data.action=='open_channel') {
				this.openChannel(data, result => {
					console.log('openChannel result',result)
					this.RTC.sendMsg({
						action    : 'channel_opened',
						game_code : game_code,
						address   : contract.address,
						result    : result
					})
				})

				return
			}

			if (data.action=='call_channelgame_function') {
				this.callFunction(data)
			}

			if (data.action=='close_channel') {
				this.closeChannel(data, result => {
					console.log('closeChannel result',result)
					this.RTC.sendMsg({
						action    : 'channel_closed',
						game_code : game_code,
						address   : contract.address,
						result    : result
					})
				})

				return
			}

		})
	}

	iamActive(){
		Eth.getBetsBalance(Eth.Wallet.get().openkey, bets=>{
			this.RTC.sendMsg({
				action    : 'bankroller_active',
				game_code : game_code,
				address   : contract.address,
				deposit   : bets*100000000
			})

			setTimeout(()=>{
				this.iamActive()
			}, 2000)
		})
	}

	openChannel(data, callback){
		const args = [
			data.args.channel_id,
			data.args.address_player,
			data.args.player_deposit,
			data.args.bankroll_deposit,
			data.args.nonce,
			data.args.time,
		]

		try {
			const msgHash = web3.utils.soliditySha3.apply(this, args)
			const recover = web3.eth.accounts.recover(msgHash, data.sig)

			if (recover.toLowerCase() != data.user_id.toLowerCase()) {
				return
			}
		} catch(e) {
			console.error('Recover error', e)
			return
		}

		args.push( data.sig )

		let prev_trans = false
		const sendTrans = (signedTx, cb, repeat=5)=>{
			console.log('TXs:',prev_trans, signedTx)
			if (prev_trans==signedTx) return
			console.log('sendRawTransaction')
			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
				repeat--
				if (!response || !response.result || response.error) {
					if (repeat < 0 || (response && response.error && response.error.code==-32000)) return
					setTimeout(()=>{ sendTrans(signedTx, cb, repeat) }, 1500)
					return
				}

				prev_trans = signedTx

				// Create game logic
				Games[data.args.channel_id] = new GameLogic(data.args.player_deposit)

				_channels[data.args.channel_id] = {
					player_deposit:   data.args.player_deposit,
					bankroll_deposit: data.args.bankroll_deposit,
				}

				cb( response.result )
			}).catch(e=>{
				repeat--
				console.error('sendTrans Error:', e)
				setTimeout(()=>{ sendTrans(signedTx, cb, repeat) }, 1500)
			})
		}

		// open(bytes32 id, address player, uint playerDeposit, uint bankrollDeposit, uint nonce, uint time, bytes sig) {
		Eth.Wallet.signedContractFuncTx(
			contract.address, contract.abi,
			'open', args,
			signedTx => { sendTrans(signedTx, callback) },
			900000
		)
	}


	closeChannel(data, callback){
		let c = _channels[data.args.channel_id]
		if (!c) return

		const args = [
			data.args.channel_id,
			data.args.player_balance,
			data.args.bankroll_balance,
			data.args.nonce,
		]

		const msgHash = web3.utils.soliditySha3.apply(this, args)
		const recover = web3.eth.accounts.recover(msgHash, data.sig)

		if (recover.toLowerCase() != data.user_id.toLowerCase()) {
			console.log('invalid sig')
			return
		}

		args.push( data.sig )

		console.log('channel deposits', c)

		const bankroll_balance = Math.ceil( 1*(c.bankroll_deposit + (c.player_deposit - Games[data.args.channel_id].balance())) )

		console.log('bankroll_balance', bankroll_balance)
		console.log('data.args.bankroll_balance', data.args.bankroll_balance)
		if (data.args.bankroll_balance*1 !== bankroll_balance) {
			return
		}

		console.log('closeByConsent',args)

		let prev_trans = false
		const sendTrans = (signedTx, cb, repeat=5)=>{
			if (prev_trans==signedTx) return
			prev_trans = signedTx

			Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
				repeat--
				if (!response || !response.result || response.error) {
					if (repeat < 0 || (response && response.error && response.error.code==-32000)) return
					setTimeout(()=>{ sendTrans(signedTx, cb) }, 1500)
					return
				}

				// delete( Games[data.args.channel_id] )
				// delete( _channels[data.args.channel_id] )

				cb( response.result )
			})
		}

		// closeByConsent(bytes32 id, uint playerDeposit, uint bankrollDeposit, uint nonce, bytes sig)
		Eth.Wallet.signedContractFuncTx(
			contract.address, contract.abi,
			'closeByConsent', args,
			signedTx => {
				sendTrans(signedTx, callback)
			}
		)
	}

	callFunction(data){
		if (!Games[data.game_channel_id] || !Games[data.game_channel_id][data.func_name]) {
			console.log('Game not found')
			return
		}

		let check_data = Object.assign({}, data)
		delete(check_data.sig)

		if (!this.checkMsg(data.sign_data, data.sig, data.user_id)) {
			return
		}

		let args = this.prepareArgs(data.args)

		let result = Games[data.game_channel_id][data.func_name].apply(this, args)

		let send_data = {
			msg_seed  : data.msg_seed,
			action    : 'call_channelgame_function',
			game_code : game_code,
			address   : contract.address,
			result    : result,
		}
		console.log('rand res', send_data)
		this.RTC.sendMsg(send_data)
	}

	prepareArgs(args){
		if (!args || !args.length) {
			return []
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


	confirm(rawMsg=false){
		if (!rawMsg) {
			return
		}

		return Eth.Wallet.lib.signing.concatSig( Eth.Wallet.lib.signing.signMsg(
			Eth.Wallet.getKs(),
			Eth.Wallet.getPwDerivedKey(),
			rawMsg,
			Eth.Wallet.get().openkey
		) )
	}


	signMsg(data2sign, callback){
		 Eth.Wallet.getPwDerivedKey(pwDerivedKey=>{
		 	this.PwDerivedKey = pwDerivedKey
			const VRS = Eth.Wallet.lib.signing.signMsgHash(
				Eth.Wallet.getKs(),
				pwDerivedKey,
				web3.utils.soliditySha3.apply(this, data2sign),
				Eth.Wallet.get().openkey.substr(2)
			)

			const singnedMsgHash = Eth.Wallet.lib.signing.concatSig(VRS)
			callback(singnedMsgHash)
		})
	}

	checkMsg(check_data, sig, user_id){
		const recover = web3.eth.accounts.recover((web3.utils.soliditySha3.apply(this, check_data)), sig)

		return (recover.toLowerCase() == user_id.toLowerCase())
	}

	// Проверяем разрешил ли игрок списывать бэты контракту
	setGameContract(address, callback){
		console.log('setGameContract')
		this.getAllowance(address, allowance_bets =>{
			console.log('allowance_bets',allowance_bets)
			if (allowance_bets < 1000000) {
				this.approveContract(address, 2000000, ()=>{
					this.setGameContract(address, callback)
					return
				})
				return
			}

			// all ok
			callback()
		})
	}

	// Проверяем сколько денег разрешено списывать контракту игры
	getAllowance(address, callback){
		Eth.RPC.request('call', [{
			'from' : Eth.Wallet.get().openkey,
			'to'   : _config.erc20_address,
			'data' : '0x'+Eth.hashName('allowance(address,address)') + Utils.pad(Eth.Wallet.get().openkey.substr(2), 64) + Utils.pad(address.substr(2), 64)
		}, 'latest']).then( response => {
			callback( Utils.hexToNum(response.result) )
		})
	}

	// Разрешаем контракту игры списывать с нас бэты
	approveContract(address, max_bets, callback, repeat=3){
		this.transactContractFunction(
			_config.erc20_address, _config.erc20_abi,

			'approve', [address, max_bets*100000000],

			0,

			response => {
				if (!response || !response.result) {
					setTimeout(()=>{
						console.log('repeat approveContract')
						repeat--
						if (repeat < 1) {
							callback({error:'Cant_approve_contract'})
							return
						}
						this.approveContract(address, max_bets, callback, repeat)
					}, 3000)
					return
				}

				const checkResult = ()=>{ setTimeout( ()=>{
					this.getAllowance(address, res => {
						if (res >= max_bets*100000000) {
							callback( res )
							return
						}
						checkResult()
					})
				}, 2000) }

				checkResult()
			}
		)
	}
	transactContractFunction(address, abi, func_name, func_params, value=0, callback){
		Eth.Wallet.signedContractFuncTx(
			address, abi, func_name, func_params,
			signedTx => {
				Eth.RPC.request('sendRawTransaction', ['0x' + signedTx]).then( callback )
			}
		)
	}


}

export default new DiceGameChannel()
