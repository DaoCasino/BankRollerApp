// @flow weak
import _config    from 'app.config'
import DB         from './DB/DB'
import Eth        from './Eth/Eth'
import Api        from './Api'
import Rtc        from './rtc'

import bigInt     from 'big-integer'


const WEB3 = require('web3')
const web3 = new WEB3()

import * as Utils from './utils'

import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

const contract = {
	address: '0x498bebe17f5c21a7e00e6e73d1fcfc45d1e8d7ce',
	abi:     [{'constant':true,'inputs':[{'name':'','type':'bytes32'}],'name':'disputes','outputs':[{'name':'seed','type':'bytes32'},{'name':'chance','type':'uint256'},{'name':'bet','type':'uint256'}],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'playerDeposit','type':'uint256'},{'name':'bankrollDeposit','type':'uint256'},{'name':'nonce','type':'uint256'},{'name':'sig','type':'bytes'}],'name':'closeByConsent','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'sigseed','type':'bytes'}],'name':'closeDispute','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'seed','type':'bytes32'},{'name':'nonce','type':'uint256'},{'name':'bet','type':'uint256'},{'name':'chance','type':'uint256'}],'name':'openDispute','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'seed','type':'bytes32'},{'name':'nonce','type':'uint256'},{'name':'bet','type':'uint256'},{'name':'chance','type':'uint256'},{'name':'sig','type':'bytes'},{'name':'sigseed','type':'bytes'}],'name':'updateGame','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'player','type':'address'},{'name':'playerDeposit','type':'uint256'},{'name':'bankrollDeposit','type':'uint256'},{'name':'nonce','type':'uint256'},{'name':'time','type':'uint256'},{'name':'sig','type':'bytes'}],'name':'open','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'},{'name':'playerDeposit','type':'uint256'},{'name':'bankrollDeposit','type':'uint256'},{'name':'nonce','type':'uint256'},{'name':'sig','type':'bytes'}],'name':'update','outputs':[],'payable':false,'type':'function'},{'constant':true,'inputs':[{'name':'','type':'bytes32'}],'name':'channels','outputs':[{'name':'player','type':'address'},{'name':'bankroller','type':'address'},{'name':'playerDeposit','type':'uint256'},{'name':'bankrollDeposit','type':'uint256'},{'name':'nonce','type':'uint256'},{'name':'endTime','type':'uint256'}],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'h','type':'bytes32'},{'name':'signature','type':'bytes'}],'name':'recoverSigner','outputs':[{'name':'','type':'address'}],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'id','type':'bytes32'}],'name':'closeByTime','outputs':[],'payable':false,'type':'function'},{'constant':false,'inputs':[{'name':'signature','type':'bytes'}],'name':'signatureSplit','outputs':[{'name':'r','type':'bytes32'},{'name':'s','type':'bytes32'},{'name':'v','type':'uint8'}],'payable':false,'type':'function'}]
}
const game_code        = 'dice_gamechannel'
const rtc_room         = 'game_channel_'+game_code


class DiceGameChannel {
	constructor(){

		// this.Queue = new AsyncPriorityQueue({
		// 	debug:               false,
		// 	maxParallel:         1,
		// 	processingFrequency: 500,
		// })

		// this.Queue.start()

		this.startMesh()
	}

	startMesh(){
		this.RTC = new Rtc( (Eth.Wallet.get().openkey || false) , rtc_room )

		this.iamActive()


		this.RTC.subscribe(contract.address, data => {
			if (!data || !data.action || !data.game_code || data.game_code!=game_code) { return }


			if (data.action=='open_channel') {
				this.openChannel(data)
				return
			}
			// if (data.action=='get_random') {
			// 	this.sendRandom(data)
			// 	return
			// }
			// if (data.action=='close_game_channel') {
			// 	this.endGame(data)
			// 	return
			// }
		})
	}

	iamActive(){
		Eth.getBetsBalance(Eth.Wallet.get().openkey, bets=>{
			this.RTC.sendMsg({
				action    : 'bankroller_active',
				game_code : game_code,
				address   : contract.address,
				deposit   : bets
			})

			setTimeout(()=>{
				this.iamActive()
			}, 2000)
		})
	}

	async openChannel(data){
		const types   = ['bytes32', 'address', 'uint', 'uint', 'uint', 'uint']

		const args = [
			data.args.channel_id,
			data.args.address_player,
			data.args.player_deposit,
			data.args.bankroll_deposit,
			data.args.nonce,
			data.args.time,
		]

		const msgHash = web3.utils.soliditySha3.apply(this, Object.values(args))
		const recover = web3.eth.accounts.recover(msgHash, data.sig)

		if (recover != data.user_id) {
			return
		}

		console.log('openChannel')

		args.push(data.sig)

		console.log('data.args',data.args)
		console.log('Object.keys(data.args)', Object.keys(data.args))
		console.log('args',args)

		// open(bytes32 id, address player, uint playerDeposit, uint bankrollDeposit, uint nonce, uint time, bytes sig) {
		Eth.Wallet.signedContractFuncTx(
			contract.address, contract.abi,
			'open', args,
			signedTx => {
				Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
					console.log(response)
				})
			}
		)



		// open(bytes32 id, address player, uint playerDeposit, uint bankrollDeposit, uint nonce, uint time, bytes sig)
	}

	checkSIG(rawMsg, signature, openkey){
		let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
		let r = signature.slice(0, 66)
		let s = '0x' + signature.slice(66, 130)

		let msg_openkey = false

		try {
			msg_openkey = Utils.buf2bytes32( Eth.Wallet.lib.signing.recoverAddress(rawMsg, v, r, s) )
		} catch(e) {
			console.error('recoverAddress err:',e)
			return false
		}

		let ok = (msg_openkey==openkey)

		if (!ok) {
			console.error('invalid sig', msg_openkey+'!=='+openkey)
		};

		return ok
	}


}

export default new DiceGameChannel()
