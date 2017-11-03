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
	TODO: Bankroller
	 - выпилить eth-ligthwallet - заменить его на web3
     - избавиться от RPC - юзать web3
     - написать открытие закрытие каналов
     - написать подпись и валидацию подписи сообщений
     - заменить мессенджинг на ipfs
     - написать ведение статистики игр
     - сделать красивый интерфейс таба разработчика
     - написать деплой игры в ipfs
     - написать установку игры из ipfs
*/



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

		this.response(params, {id:connection_id}, this.sharedRoom)
		
		console.log('User '+user_id+' connected to '+this.code)


		const signMsg = async (rawMsg=false)=>{
			if (!rawMsg) return ''

			return new Promise(async (resolve, reject) => {
				
				console.log('signMsg', rawMsg)

				const sig = Eth.Wallet.lib.signing.concatSig( Eth.Wallet.lib.signing.signMsg(
					Eth.Wallet.getKs(),
					await Eth.Wallet.getPwDerivedKey(),
					rawMsg,
					Eth.Wallet.get().openkey
				) )

				console.log('sig:',sig)
				resolve(sig)
				return sig
			})
		}

		const prepareArgs = async (args=[])=>{
			args = args || []
			
			return new Promise(async (resolve, reject) => {
				
				let new_args = []
				for(let k in args){
					let arg = args[k]
					if (arg && (''+arg).indexOf('confirm')!=-1) {
						let seed = arg.split('confirm(')[1].split(')')[0]
						arg = (await signMsg(seed)).substr(2)
					}

					new_args.push(arg)
				}
				
				resolve(new_args)
			})
		}


		// Listen personal user room messages
		const listen_all = async data => {
			if (!data || !data.action || !data.user_id || !this.users[data.user_id]) return

			let User = this.users[data.user_id]
			
			if (data.action=='open_channel') {
				this._openChannel(data)
			}

			// call user logic function
			if (data.action=='call') {
				if (!data.func || !data.func.name || !data.func.args) return				
				if (!User.logic[data.func.name]) return

				let args    = await prepareArgs(data.func.args)
				let returns = User.logic[data.func.name].apply(this, args)

				this.response(data, {
					args    : args,
					returns : returns
				}, User.room)

				return
			}

			if (data.action=='disconnect') {
				console.log('User '+data.user_id+' disconnected')
				User.room.off('all', listen_all)
				delete(this.users[data.user_id])
				this.response(data, {disconnected:true}, User.room)
				return
			}
		}
		this.users[user_id].room.on('all', listen_all)
	}

	_openChannel(params){
		console.log(params)
	}
	

	// Send message and wait response
	request(params, callback=false, Room=false){
		if (!Room) {
			console.error('request roo not set!')
			return
		}

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
		if (!Room) {
			console.error('request roo not set!')
			return
		}

		request_data.response = response
		request_data.type     = 'response'

		Room.send(request_data)
	}

}
