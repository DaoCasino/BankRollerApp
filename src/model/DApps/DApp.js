import _config  from 'app.config'
import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'

import * as Utils from '../utils'

// @TODO
const default_paymentchannel_contract = {
	address : '0x...',
	abi     : JSON.parse('{}')
}


const max_users = 9

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
		this.users = {}

		this.sharedRoom = new Rtc( (Eth.Wallet.get().openkey || false) , 'dapp_room_'+this.hash )

		console.groupCollapsed('DApp %c'+this.code+' %ccreated','color:orange','color:default')
		console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
		console.info('%c SHA3: %c' + this.hash , 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')
		console.groupCollapsed('Logic string')
		console.log( Utils.clearcode( params.logic ) )
		console.groupEnd()
		console.groupEnd()



		// Sending beacon messages to room
		// that means we are online
		const beacon = (t)=>{
			
			// max users connected
			// dont send beacon
			if(Object.keys(this.users).length >= max_users){
				setTimeout(()=>{ beacon() }, t)
				return
			}
			
			Eth.getBetsBalance( Eth.Wallet.get().openkey , bets=>{
				this.sharedRoom.sendMsg({
					action  : 'bankroller_active',
					deposit : bets*100000000,
					dapp: {
						code : this.code,
						hash : this.hash,	
					},
				})
				setTimeout(()=>{ beacon() }, t)
			})
		}
		beacon( 3000 )



		// Listen users actions
		this.sharedRoom.on('all', data => {
			if (!data || !data.action || data.action=='bankroller_active') {
				return
			}

			// User want to connect
			if (data.action=='connect') {
				this._newUser(data)
			}
		})
	}


	// User connect
	_newUser(params){
		const connection_id = Utils.makeSeed()
		const user_id       = params.user_id

		this.users[user_id] = {
			id    : connection_id,
			num   : Object.keys(this.users).length,
			logic : new this.logic(),
			room  : new Rtc( Eth.Wallet.get().openkey, this.hash+'_'+connection_id )
		}

		this.response(params, {id:connection_id})
		
		console.log('User '+user_id+' connected')



		const signMsg = async (rawMsg=false)=>{
			if (!rawMsg) return ''
			return Eth.Wallet.lib.signing.concatSig( Eth.Wallet.lib.signing.signMsg(
				Eth.Wallet.getKs(),
				await Eth.Wallet.getPwDerivedKey(),
				rawMsg,
				Eth.Wallet.get().openkey
			) )
		}

		const prepareArgs = (args)=>{
			if (!args || !args.length) return []
			
			let new_args = []
			args.forEach( arg => {
				if (arg && (''+arg).indexOf('confirm')!=-1) {
					let seed = arg.split('confirm(')[1].split(')')[0]
					arg = signMsg(seed)
				}

				new_args.push(arg)
			})
			return new_args
		}


		// Listen personal user room messages
		const listen_all = data => {
			if (!data || !data.action || !data.user_id || !this.users[data.user_id]) return

			let User = this.users[data.user_id]
			
			// call user logic function
			if (data.action=='call') {
				if (!data.func || !data.func.name || !data.func.args) return				
				if (!User.logic[data.func.name]) return

				let args    = prepareArgs(data.func.args)
				let returns = User.logic[data.func.name].apply(this, args)

				this.response(data, {
					args    : args,
					returns : returns
				})

				return
			}

			if (data.action=='disconnect') {
				console.log('User '+data.user_id+' disconnected')
				User.room.off('all', listen_all)
				delete(this.users[data.user_id])
				this.response(data, {disconnected:true})
				return
			}
		}
		this.users[user_id].room.on('all', listen_all)
	}


	

	// Send message and wait response
	request(params, callback=false, Room=false){
		Room = Room || this.Room || this.sharedRoom

		return new Promise((resolve, reject) => {

			const uiid = Utils.makeSeed()
			
			params.type = 'request'
			params.uiid = uiid

			// Send request
			console.log(params)
			Room.send(params, delivered => {
				if (!delivered) {
					console.error('🙉 Cant send msg to bankroller, connection error')
					reject()
					return
				}
			})

			// Wait response
			Room.once('uiid::'+uiid, result=>{
				if (callback) callback(result)
				resolve(result.response)
			})
		})
	}
	
	// Response to request-message
	response(request_data, response, Room=false){
		Room = Room || this.Room || this.sharedRoom

		request_data.response = response
		Room.send(request_data)
	}

}
