import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'
import * as Utils from '../utils'

export default class Messaging {
	constructor(params) {
		this.dapp_code = params.code
		this.dapp_hash = Utils.sha3( params.code )
		this.contract  = params.contract
		
		// common dapp room
		this.Room = new Rtc( (Eth.Wallet.get().openkey || false) , 'rtc_room_'+this.dapp_code )

		this.iamActive()

		this.subscribes = {}
		this.Room.subscribe(this.dapp_hash, data => {
			if (!data           || 
				!data.action    || 
				!data.dapp_code || 
				data.dapp_code  != this.dapp_code
			) { return }

			if (this.subscribes[data.action]) {
				this.subscribes[data.action].forEach( func =>{
					func(data)
				})
			}
		})
	}

	on(action, callback){
		if (!this.subscribes[action]) {
			this.subscribes[action] = []
		}
		this.subscribes[action].push( callback )
	}

	iamActive(){
		Eth.getBetsBalance( Eth.Wallet.get().openkey , bets=>{
			this.Room.sendMsg({
				action    : 'bankroller_active',
				dapp_code : this.dapp_code,
				address   : this.dapp_hash,
				deposit   : bets*100000000
			})

			setTimeout(()=>{
				this.iamActive()
			}, 2000)
		})
	}
}