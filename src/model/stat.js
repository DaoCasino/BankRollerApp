import _config from 'app.config'
import Eth     from 'Eth/Eth'

import {hexToNum} from 'utils'

export default new class Stat {
	constructor() {

	}

	getProfit(callback){
		Eth.RPC.request('call', [{
			'to':   _config.stat_contract,
			'data': '0x' + Eth.hashName('adviserProfit(address)') + Eth.Wallet.get().address
		}, 'pending'], 0).then( response => {
			if (!response || !response.result) { return }
			callback( hexToNum(response.result) )
		})
	}

	getReferralsCount(callback){
		Eth.RPC.request('call', [{
			'to':   _config.stat_contract,
			'data': '0x' + Eth.hashName('adviserCount(address)') + Eth.Wallet.get().address
		}, 'latest'], 0).then( response => {
			if (!response || !response.result) { return }
			callback( hexToNum(response.result) )
		})
	}
}
