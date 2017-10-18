import _config  from 'app.config'


// helpers
import ApproveContract from './approve.js'
import startMessaging  from './messaging.js'

// import * as Utils from '../utils'


/*
 * DApp constructor
 */
export default class DApp {
	constructor(params) {
		console.log('dapp constructor11!')
		this.code     = params.code
		this.logic    = params.logic
		
		this.stat = {}

		// this.contract = params.contract
		
		// approve this contract in erc20
		// ApproveContract(this.contract.address, ()=>{ })

		this.Messaging = new startMessaging({
			code     : this.code,
			// contract : this.contract
		})

		// this.Messaging.on('open_channel')

		// init default Actions
		// this.Messaging
	}

	getRandom(min,max){

	}

	openChannel(){}
	closeChannel(){}
	
}
