import _config  from 'app.config'
import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'

import * as Utils from '../utils'

// @TODO
const default_paymentchannel_contract = {
	address : '0x...',
	abi     : JSON.parse('{}')
}



/*
 * DApp constructor
 */
export default class DApp {
	constructor(params) {
		if (!params.code || !params.logic) {
			console.error('Create DApp error', params)
			throw new Error('code and logic is required')
			return
		}

		this.code  = params.code
		this.logic = params.logic		
		this.hash  = Utils.checksum( params.logic )
		this.room  = 'dapp_room_'+this.hash

		console.groupCollapsed('DApp %c'+this.code+' %ccreated','color:orange','color:default')
		console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
		console.info('%c SHA3: %c' + this.hash , 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')
		console.groupCollapsed('Logic string')
		console.log( Utils.clearcode( params.logic ) )
		console.groupEnd()
		console.groupEnd()


		this.Room = new Rtc( (Eth.Wallet.get().openkey || false) , this.room )
		this.iamActive()

		this.Room.subscribe('all', data => {
			console.log('data', data)
			if (!data || !data.action || data.action!='bankroller_active') {
				return
			}
		})
	}

	iamActive(){
		console.log('i am active')
		Eth.getBetsBalance( Eth.Wallet.get().openkey , bets=>{
			this.Room.sendMsg({
				action  : 'bankroller_active',
				deposit : bets*100000000,
				dapp: {
					code : this.code,
					hash : this.hash,	
				},
			})

			setTimeout(()=>{
				this.iamActive()
			}, 3000)
		})
	}

	getRandom(min,max){

	}

	openChannel(){}
	closeChannel(){}
	
}
