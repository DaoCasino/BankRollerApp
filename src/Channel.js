
import Eth from 'Eth/Eth'
import * as Utils from 'utils'


import channel_contract from './configs/channel.abi.js'

export default new class Channel {
	constructor() {

	}

	close(contractAddress=false, playerAddress=false, channel_id=false, deposit=false, callback, repeat=3){
		console.log('CLOSE', contractAddress, 'closeChannel', playerAddress, deposit)

		if (!contractAddress || !playerAddress || !channel_id) {
			return
		}

		const add = ( deposit > 0 )

		const profit = this.BETs( Math.abs(deposit) )

		this.callFunc(contractAddress, 'closeChannel', [playerAddress, channel_id, profit, add], response => {
			console.log('response', response)
			if (!response || !response.result) {
				repeat--
				if (repeat > 0) {
					this.close(contractAddress, playerAddress, deposit, callback, repeat)
				}
				return
			}

			this.isOpenChannel(contractAddress, playerAddress, channel_id, opened => {
				callback( !opened )
			})
		})
	}

	isOpenChannel(contractAddress, playerAddress=false, channel_id=false, callback, repeat=5){ setTimeout(()=>{
		if (!playerAddress || !channel_id) { return }
		repeat--

		Eth.RPC.request('call', [{
			'to':   contractAddress,
			'data': '0x'
				+ Eth.hashName('getOpenChannel(address,bytes32)')
					+ Utils.pad(playerAddress.substr(2), 64)
					+ Utils.pad(channel_id.substr(2), 64)

		}, 'latest']).then( response => {
			let opened = true

			if (response && response.result) {
				opened = ( Utils.hexToNum(response.result, 16) > 0)
			}

			if (opened && repeat > 0) {
				this.isOpenChannel(contractAddress, playerAddress, channel_id, callback, repeat)
				return
			}

			callback( opened )
		})
	}, 3000) }

	callFunc(address, name, args, callback){
		Eth.Wallet.signedContractFuncTx( address, channel_contract.abi, name, args,
			signedTx => {
				Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( callback )
			}
		)
	}

	BETs(num){
		return num*100000000
	}

}
