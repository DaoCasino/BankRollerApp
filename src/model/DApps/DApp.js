import _config  from 'app.config'
import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'

import * as Utils      from '../utils'
import paychannelLogic from './paychannel'

const payChannelWrap = function(logic){
	let payChannel             = new paychannelLogic()
	logic.prototype.payChannel = payChannel
	let modifiedLogic          = new logic()
	modifiedLogic.payChannel   = payChannel
	return modifiedLogic
}

const Account       = Eth.Wallet
const _openkey      = Account.get().openkey
const web3          = Account.web3
const all_wallet    = []
const timer_val     = 30
let   approve_state = false

const ERC20 = new web3.eth.Contract(
	_config.contracts.erc20.abi, 
	_config.contracts.erc20.address 
)

const ERC20approve = async function(spender, amount, callback=false){
	return new Promise(async (resolve, reject) => {

		console.log('Check how many tokens user '+_openkey+' is still allowed to withdraw from contract '+spender+' . . . ')
		
		let allowance = await ERC20.methods.allowance( _openkey, spender ).call()

		console.log('💸 allowance:', allowance)

		if (allowance < amount*3 && approve_state==false) {
			
			approve_state = true
			console.log('allowance lower than need deposit')
			console.group('Call .approve on ERC20')
			console.log('Allow paychannle to withdraw from your account, multiple times, up to the '+amount+' amount.')

			const receipt = await ERC20.methods.approve( 
				spender,
				amount * 20
			).send({
				from     : _openkey         ,
				gasPrice : _config.gasPrice ,
				gas      : (await ERC20.methods.approve(spender, amount * 9).estimateGas({from : _openkey})),
			})
			.on('error', err=>{ 
				console.error(err)
				reject(false, err)
			})
			
			console.log('📌 ERC20.approve receipt:', receipt)
			
			allowance = await ERC20.methods.allowance( _openkey, spender ).call()

			if (allowance > amount*3) {
				approve_state = false
			}

			console.log('💸💸💸 allowance:', allowance)

			console.groupEnd()			
		}
		
		resolve(true, null)
		if (callback) callback()
	})
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
		if (!params.slug) {
			console.error('Create DApp error', params)
			throw new Error('slug option is required')
			return
		}

		let G = window || global

		if (!G.DAppsLogic || !G.DAppsLogic[params.slug]) {
			console.log('First you need define your DApp logic')
			console.log('Example DCLib.defineDAppLogic("'+params.slug+'", function(){...})')
			throw new Error('Cant find DApp logic')
		}

		this.slug          = params.slug
		this.code          = params.slug || params.code
		this.logic         = G.DAppsLogic[this.slug]		
		this.hash          = Utils.checksum( this.logic )
		this.users         = {}
		this.sharedRoom    = new Rtc( (_openkey || false) , 'dapp_room_'+this.hash )

		if (params.contract) {
			console.log('Your contract is add')
			this.contract_address = params.contract.contract_address
			this.contract_abi     = params.contract.contract_abi
		} else {
			console.log('Standart payChannel contract is add')
			this.contract_address = _config.contracts.paychannel.address
			this.contract_abi     = _config.contracts.paychannel.abi
		}

		console.groupCollapsed('DApp %c'+this.slug+' %ccreated','color:orange','color:default')
		console.info(' >>> Unique DApp logic checksum/hash would be used for connect to bankrollers:')
		console.info('%c SHA3: %c' + this.hash , 'background:#333; padding:3px 0px 3px 3px;', 'color:orange; background:#333; padding:3px 10px 3px 3px;')
		console.groupCollapsed('Logic string')
		console.log( Utils.clearcode( this.logic ) )
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
			
			Eth.getBetsBalance( _openkey , bets=>{
				this.sharedRoom.sendMsg({
					action  : 'bankroller_active',
					deposit : bets*100000000     ,
					dapp    : {
						slug : this.slug         ,
						hash : this.hash
					}
				})
				setTimeout(()=>{ beacon() }, t)
			})
		}
		beacon( 3000 )



		// Listen users actions
		this.sharedRoom.on('all', data => {
			if (!data || !data.action || data.action=='bankroller_active') { return }

			// User want to connect
			if (data.action=='connect' && data.slug==this.slug) { 
				this._newUser(data) 
			}
		})
	}


	// User connect
	async _newUser(params){

		const connection_id      = Utils.makeSeed()
		const user_id            = params.user_id

		if(this.users[user_id]) {

			if (this.users[user_id].channel) {
			    return
			} else this.users[user_id].logic.payChannel.reset()
		}

		this.users[user_id] = {
			id    : connection_id                  ,
			num   : Object.keys(this.users).length ,
			logic : payChannelWrap(this.logic)     ,
			room  : new Rtc( _openkey, this.hash+'_'+connection_id )
		}

		const signMsg = async (rawMsg=false)=>{
			if (!rawMsg) return ''

			return new Promise(async (resolve, reject) => {
				
				console.log('signMsg', rawMsg)

				const sig = Account.lib.signing.concatSig( Account.lib.signing.signMsg(
					Account.getKs()                 ,
					await Account.getPwDerivedKey() ,
					rawMsg                          ,
					_openkey
				))

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
				console.log('user room action open channel')
				this._openChannel(data)
			}
			if (data.action=='close_channel') {
				console.log('user room action close channel')
				this._closeChannel(data)
			}

			if (data.action=='update_state') {
				this._updateState(data)
			}

			if (data.action=='timeout_start') {
				console.log('timeout start for '+timer_val+' sec')
				this.response(data, {timeout_start : true}, User.room)
				this._closeByTimeout(data)
			}

			if (data.action=='close_timeout') { 
				User.timer = timer_val
				this.response(data, {state_channel:User.channel_state}, User.room)
			}

			if (data.action=='close_dispute') {
				console.log('close dispute')
				this._closeDispute(data)
			}

			// call user logic function
			if (data.action=='call') {
				if (!data.func || !data.func.name || !data.func.args) return				
				if (!User.logic[data.func.name]) return

				console.log('User.logic', User.logic)
				console.log('User.logic.payChannel', User.logic.payChannel)

				let args    = await prepareArgs(data.func.args)
				let returns = User.logic[data.func.name].apply(this, args)

				this.response(data, {
					args    : args    ,
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

		setTimeout(()=>{
			this.response(params, {id:connection_id}, this.sharedRoom)
			console.log('User '+user_id+' connected to '+this.slug)
		}, 999)
	}

	PayChannel(){
		if (this.PayChannelContract ) return this.PayChannelContract

		let pay_contract_abi     = ''
		let pay_contract_address = ''

		if (typeof this.contract_address != 'undefined' && typeof this.contract_abi != 'undefined') {
			pay_contract_abi     = this.contract_abi
			pay_contract_address = this.contract_address
		}

		this.PayChannelContract = new web3.eth.Contract(pay_contract_abi, pay_contract_address)

		return this.PayChannelContract
	}

	async _openChannel(params){
		const response_room = this.users[params.user_id].room
		console.log('OPEN')
		if (this.users[params.user_id].channel_state === true) return

		this.users[params.user_id].channel_state = true
		this.users[params.user_id].state_close                         = true

		const bankroller_deposit = params.open_args.player_deposit*10
		const paychannel         = new paychannelLogic(parseInt(bankroller_deposit))

		this.users[params.user_id].logic.payChannel = paychannel
		this.users[params.user_id].logic.payChannel.reset()

		if (typeof params.open_args.gamedata === 'undefined') { 
			console.error('Error! game data not found') 
			return
		}

		const channel_id         = params.open_args.channel_id
		const player_address     = params.open_args.player_address
		const bankroller_address = params.open_args.bankroller_address
		const player_deposit     = params.open_args.player_deposit
		const session            = params.open_args.session
		const game_data          = params.open_args.gamedata
		const ttl_blocks         = params.open_args.ttl_blocks
		const signed_args        = params.open_args.signed_args

		console.log(params)
		const approve = await ERC20approve(this.PayChannel().options.address, bankroller_deposit*10000)
			

		this.users[params.user_id].logic.payChannel.setDepositBankroll(parseInt(bankroller_deposit))
		this.player_address = player_address
		let rec_openkey     = ''

		game_data
			? rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks, game_data), signed_args )
		    : rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks), signed_args )

		if (player_address!=rec_openkey) {
			console.error('🚫 invalid sig on open channel', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}

		const sign_bankroller = Account.signHash(Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks, game_data))

		if (approve) {
			this.users[params.user_id].logic.payChannel.setDeposit( Utils.dec2bet(player_deposit) )
			this.response(params, { sign_bankroller:sign_bankroller }, response_room)
		}
	}

	
	async _closeChannel(params){
		this.users[params.user_id].state_close = false
		const response_room      =  this.users[params.user_id].room
		const bankroller_address =  this.users[params.user_id].game_address
		const channel_id         =  params.close_args.channel_id         // bytes32 id,
		const player_balance     =  params.close_args.player_balance     // uint playerBalance,
		const bankroller_balance =  params.close_args.bankroller_balance // uint bankrollBalance,
		const session            =  params.close_args.session || 0         // uint session=0px
		const signed_args        =  params.close_args.signed_args
		const bool               =  params.close_args.bool    || true

		// Check Sig
		const hash        = Utils.sha3(channel_id, player_balance, bankroller_balance, session, bool)
		const rec_openkey = web3.eth.accounts.recover(hash, signed_args)
		
		if (params.user_id != rec_openkey) {
			console.error('🚫 invalid sig on open channel', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}

		// Check user results with out results
		const channel              = this.users[params.user_id].paychannel
		const user_profit          = this.users[params.user_id].logic.payChannel._getProfit()
		const l_player_balance     = Utils.bet2dec(this.users[params.user_id].logic.payChannel.getBalance())
		const l_bankroller_balance = Utils.bet2dec(this.users[params.user_id].logic.payChannel.getBankrollBalance())

		if (!params.close_args.timeout) {
			if (l_player_balance!=player_balance || l_bankroller_balance!=bankroller_balance) {
				console.error('Invalid profit',{
					l_player_balance     : l_player_balance     ,
					player_balance       : player_balance       ,
					l_bankroller_balance : l_bankroller_balance ,
					bankroller_balance   : bankroller_balance
				})
				this.response(params, { error:'Invalid profit' }, response_room)
				return
			}
		}

		delete this.users[params.user_id].timer
		const signed_bankroller = Account.signHash(hash)
		this.response(params, { signed_bankroller:signed_bankroller }, response_room)
	}

	_closeByTimeout(params) {

		this.users[params.time_args.player_address].timer = timer_val
		
		const run = ()=> {
			if (this.users[params.time_args.player_address].timer < 5) {
				if (this.users[params.time_args.player_address].state_close==false)    { return }

				const bankroller_balance = this.users[params.time_args.player_address].room.state_data.bankroller_balance
				const player_address     = this.users[params.time_args.player_address].room.state_data.player_address    
				const channel_id         = this.users[params.time_args.player_address].room.state_data.channel_id        
				const player_balance     = this.users[params.time_args.player_address].room.state_data.player_balance    
				const session            = this.users[params.time_args.player_address].room.state_data.session           
				const bool               = this.users[params.time_args.player_address].room.state_data.bool              
				const signed_args        = this.users[params.time_args.player_address].room.state_data.signed_args   
				const response_room  	 = this.users[params.time_args.player_address].room

				this.users[player_address].channel_state = false

				const gasLimit = 900000
			
				console.log('Send close channel trancsaction')
				console.log('⛽ gasLimit:', gasLimit)

				const close = this.PayChannel().methods
					.closeByConsent(
						channel_id         ,
						player_balance     ,
						bankroller_balance ,
						session            ,
						bool               ,
						signed_args
					).send({
						gas      : gasLimit               ,
						gasPrice : 1.2 * _config.gasPrice ,
						from     : _openkey
					})
					.on('transactionHash', transactionHash=>{
						console.log('# closechannel TX pending', transactionHash)
						console.log('https://ropsten.etherscan.io/tx/'+transactionHash)
						console.log('⏳ wait receipt...')
					})
					.on('error', err=>{ 
						console.warn('Close channel error', err)
					})
					clearInterval(checkTimeout)
			}
			this.users[params.time_args.player_address].timer--
		}
		const checkTimeout = setInterval(run, 1000)
	}

	async _closeDispute(params) {

		const response_room      = this.users[params.close_args.player_address].room
		const player_address     = response_room.state_data.player_address
		const channel_id         = params.close_args.channel_id
		const dispute_seed       = params.close_args.dispute_seed
		const bankroller_sign    = Account.signHash(dispute_seed)
		
		const gasLimit = 900000
		const receipt = await this.PayChannel().methods
			.closeDispute(
				channel_id      ,
				bankroller_sign
			).send({
				gas      : gasLimit               ,
				gasPrice : 1.2 * _config.gasPrice ,
				from     : _openkey
			})
			.on('transactionHash', transactionHash=>{
				console.log('# close dispute TX pending', transactionHash)
				console.log('https://ropsten.etherscan.io/tx/'+transactionHash)
				console.log('⏳ wait receipt...')
			})
			.on('error', err=>{ 
				console.warn('Close channel error', err)
				this.response(params, { error:'cant close channel', more:err }, response_room)
			})


		if (receipt.transactionHash) {
			this.response(params, { receipt:receipt }, response_room)
		}
	}



	_updateState(params, callback=false) {

		const response_room      = this.users[params.update_args.player_address].room
		const channel_id         = params.update_args.channel_id
		const player_address     = params.update_args.player_address
		const player_balance     = params.update_args.player_balance
		const bankroller_balance = params.update_args.bankroller_balance
		const session            = params.update_args.session
		const signed_args        = params.update_args.signed_args
		const bool               = params.update_args.bool

		this.users[player_address].room.state_data = {
			channel_id         : channel_id         ,
			player_address     : player_address     ,
			player_balance     : player_balance     ,
			bankroller_balance : bankroller_balance ,
			session            : session            ,
			bool               : bool               ,
			signed_args        : signed_args
		}

		const rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_balance, bankroller_balance, session, bool), signed_args )
		
		if (player_address!=rec_openkey) {
			console.error('🚫 invalid sig on update state', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}

		const signed_bankroller = Account.signHash(DCLib.Utils.sha3(channel_id, player_balance, bankroller_balance, session))

		console.clear()
		this.response(params, {signed_bankroller:signed_bankroller}, response_room)
	}

	// Send message and wait response
	request(params, callback=false, Room=false){
		Room = Room || this.users[this.users.state_data.player_address].room

		if (!Room) {
			console.error('request room not set!')
			return
		}

		return new Promise((resolve, reject) => {

			const uiid  = Utils.makeSeed()
			
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
