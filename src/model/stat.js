import _config from 'app.config'
import Eth     from 'Eth/Eth'

import {hexToNum} from 'utils'

export default new class Stat {
	constructor() {

	}

	async getProfit(callback){
		const response = await Eth.RPC.request('call', [{
			'to':   _config.stat_contract,
			'data': '0x' + Eth.hashName('adviserProfit(address)') + Eth.Wallet.get().address
		}, 'pending'], 0)

		if (!response || !response.result) { return }
		callback( hexToNum(response.result) )
	}

	async getReferralsCount(callback){
		const response = await Eth.RPC.request('call', [{
			'to':   _config.stat_contract,
			'data': '0x' + Eth.hashName('adviserCount(address)') + Eth.Wallet.get().address
		}, 'latest'], 0)

		if (!response || !response.result) { return }
		callback( hexToNum(response.result) )
	}
}
