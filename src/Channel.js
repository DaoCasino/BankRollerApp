
import Eth from 'Eth/Eth'
import * as Utils from 'utils'

import channel_abi from './configs/channel.abi.js'

export default new class Channel {
	constructor() {

	}

	close(contractAddress=false, playerAddress=false, deposit=false, callback, repeat=3){
		console.log('CLOSE', contractAddress, 'closeChannel', playerAddress, deposit)

		if (!contractAddress || !playerAddress || deposit==false) {
			return
		}

		let add = ( deposit > 0 )

		deposit = this.BETs( Math.abs(deposit) )


		this.callFunc(contractAddress, 'closeChannel', [playerAddress, deposit, add], response => {
			console.log('response', response)
			if (!response || !response.result) {
				repeat--
				if (repeat > 0) {
					this.close(contractAddress, playerAddress, deposit, callback, repeat)
				}
				return
			}

			this.isOpenChannel(contractAddress, playerAddress, opened => {
				callback( !opened )
			})
		})
	}

	isOpenChannel(contractAddress, playerAddress=false, callback, repeat=5){ setTimeout(()=>{
		if (!playerAddress) { return }
		repeat--

		Eth.RPC.request('call', [{
			'to':   contractAddress,
			'data': '0x' + Eth.hashName('getOpenChannel(address)') + Utils.pad(playerAddress.substr(2), 64)
		}, 'latest']).then( response => {
			let opened = true

			if (response && response.result) {
				opened = ( Utils.hexToNum(response.result, 16) > 0)
			}

			if (opened && repeat > 0) {
				this.isOpenChannel(contractAddress, playerAddress, callback, repeat)
				return
			}

			callback( opened )
		})
	}, 3000) }

	callFunc(address, name, args, callback){
		Eth.Wallet.signedContractFuncTx( address, channel_abi, name, args,
			signedTx => {
				Eth.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( callback )
			}
		)
	}

	BETs(num){
		return num*100000000
	}

}
