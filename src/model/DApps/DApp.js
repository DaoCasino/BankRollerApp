import _config  from 'app.config'
import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'

import * as Utils from '../utils'

import paychannelLogic from './paychannel'

const payChannelWrap = function(logic){
	let payChannel             = new paychannelLogic()
	logic.prototype.payChannel = payChannel
	let modifiedLogic          = new logic()
	modifiedLogic.payChannel   = payChannel
	return modifiedLogic
}



const Account  = Eth.Wallet
const _openkey = Account.get().openkey
const web3     = Account.web3

const ERC20 = new web3.eth.Contract(
	_config.contracts.erc20.abi, 
	_config.contracts.erc20.address 
)

const ERC20approve = async function(spender, amount, callback=false){
	return new Promise(async (resolve, reject) => {
		console.log('Check how many tokens user '+_openkey+' is still allowed to withdraw from contract '+spender+' . . . ')
		
		let allowance = await ERC20.methods.allowance( _openkey, spender).call()

		console.log('💸 allowance:', allowance)

		if (allowance < amount) {
			console.log('allowance lower than need deposit')

			console.group('Call .approve on ERC20')
			console.log('Allow paychannle to withdraw from your account, multiple times, up to the '+amount+' amount.')

			const receipt = await ERC20.methods.approve( 
				spender,
				amount * 9
			).send({
				from     : _openkey,
				gasPrice : _config.gasPrice,
				gas      : (await ERC20.methods.approve(spender, amount * 9).estimateGas({from : _openkey})),
			}).on('error', err=>{ 
				console.error(err)
				reject(false, err)
			})
			
			console.log('📌 ERC20.approve receipt:', receipt)
			
			allowance = await ERC20.methods.allowance( _openkey, spender).call()

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
		if (!params.code) {
			console.error('Create DApp error', params)
			throw new Error('code option is required')
			return
		}

		let G = window || global

		if (!G.DAppsLogic || !G.DAppsLogic[params.code]) {
			console.log('First you need define your DApp logic')
			console.log('Example DCLib.defineDAppLogic("'+params.code+'", function(){...})')
			throw new Error('Cant find DApp logic')
		}

		this.code  = params.code
		this.logic = G.DAppsLogic[this.code]		
		this.hash  = Utils.checksum( this.logic )
		this.users = {}
		this.sharedRoom       = new Rtc( (_openkey || false) , 'dapp_room_'+this.hash )

		if (params.contract) {
			console.log('Your contract is add')
			this.contract_address = params.contract.contract_address
			this.contract_abi     = params.contract.contract_abi
		} else {
			console.log('Standart payChannel contract is add')
			this.contract_address = _config.contracts.paychannel.address
			this.contract_abi     = _config.contracts.paychannel.abi
		}

		console.groupCollapsed('DApp %c'+this.code+' %ccreated','color:orange','color:default')
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

		if(this.users[user_id]) return 

		this.users[user_id] = {
			id    : connection_id,
			num   : Object.keys(this.users).length,
			logic : payChannelWrap(this.logic),
			room  : new Rtc( _openkey, this.hash+'_'+connection_id )
		}

		const signMsg = async (rawMsg=false)=>{
			if (!rawMsg) return ''

			return new Promise(async (resolve, reject) => {
				
				console.log('signMsg', rawMsg)

				const sig = Account.lib.signing.concatSig( Account.lib.signing.signMsg(
					Account.getKs(),
					await Account.getPwDerivedKey(),
					rawMsg,
					_openkey
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
			if (data.action=='break_connect') {
				this._breacConnetion(data)
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


		setTimeout(()=>{
			this.response(params, {id:connection_id}, this.sharedRoom)
			console.log('User '+user_id+' connected to '+this.code)
		}, 999)
	}

	PayChannel(){
		if (this.PayChannelContract ) return this.PayChannelContract

		let pay_contract_abi = ''
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



		console.log('_openChannel', params)
		
		if (typeof params.open_args.gamedata === 'undefined') {
			console.error('Error! game data not found')
		}

		const channel_id         = params.open_args.channel_id
		const player_address     = params.open_args.player_address
		const bankroller_address = _openkey
		const player_deposit     = params.open_args.player_deposit
		const bankroller_deposit = params.open_args.player_deposit*2
		const session            = params.open_args.session
		const game_data          = params.open_args.gamedata
		const ttl_blocks         = params.open_args.ttl_blocks
		const signed_args        = params.open_args.signed_args
		const paychannel         = new paychannelLogic(parseInt(bankroller_deposit))
		const approve            = await ERC20approve(this.PayChannel().options.address, bankroller_deposit*10000)

		this.player_address = player_address
		let rec_openkey = ''

		game_data
			? rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks, game_data), signed_args )
		    : rec_openkey = web3.eth.accounts.recover(Utils.sha3(channel_id, player_address, bankroller_address, player_deposit, bankroller_deposit, session, ttl_blocks), signed_args )

		if (player_address!=rec_openkey) {
			console.error('🚫 invalid sig on open channel', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}
		// estimateGas - в данном случае работает неккоректно и 
		// возвращает лимит газа аж на целый блок
		// из-за чего транзакцию никто не майнит, т.к. она одна на весь блок
		// const gasLimit = await this.PayChannel().methods.open(channel_id,player_address,bankroller_address,player_deposit,bankroller_deposit,session,ttl_blocks, signed_args).estimateGas({from: _openkey})
				
		const gasLimit = 900000

		console.log('Send open channel trancsaction')
		console.log('⛽ gasLimit:', gasLimit)
		
		const receipt = await this.PayChannel().methods
			.openChannel(
				channel_id         , // random bytes32 id
				player_address     ,
				bankroller_address ,
				player_deposit     ,
				bankroller_deposit ,
				session            , // integer num/counter
				ttl_blocks         , // channel ttl in blocks count
				game_data.value    ,
				signed_args        
			).send({
				gas      : gasLimit,
				gasPrice : 1.2 * _config.gasPrice,
				from     : _openkey,
			})
			.on('transactionHash', transactionHash=>{
				console.log('# openchannel TX pending', transactionHash)
				console.log('https://ropsten.etherscan.io/tx/'+transactionHash)
				console.log('⏳ wait receipt...')
			})
			.on('error', err=>{ 
				console.warn('Open channel error', err)
				this.response(params, { error:'cant open channel', more:err }, response_room)
			})
		
		console.log('open channel result', receipt)

		this.users[params.user_id].paychannel = {
			channel_id         : channel_id         ,
			player_deposit     : player_deposit     ,
			bankroller_deposit : bankroller_deposit ,
			session            : session            ,
		}

		if (receipt.transactionHash) {
			// Set deposit in logic
			this.users[params.user_id].logic.payChannel.setDeposit( Utils.dec2bet(player_deposit) )
		}

		this.response(params, { receipt:receipt }, response_room)
	}
	
	async _closeChannel(params){
		const response_room = this.users[params.user_id].room
		console.log('_closeChannel', params)


		const channel_id         =  params.close_args.channel_id         // bytes32 id, 
		const player_balance     =  params.close_args.player_balance     // uint playerBalance, 
		const bankroller_balance =  params.close_args.bankroller_balance // uint bankrollBalance, 
		const session            =  params.close_args.session            // uint session=0px 
		const signed_args        =  params.close_args.signed_args 
		const bool               =  params.close_args.bool

		// Check Sig
		const rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_balance, bankroller_balance, session, bool), signed_args )
		
		if (params.user_id != rec_openkey) {
			console.error('🚫 invalid sig on open channel', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}

		// Check user results with out results
		const channel     = this.users[params.user_id].paychannel
		const user_profit = this.users[params.user_id].logic.payChannel._getProfit()

		const l_player_balance     =  user_profit + channel.player_deposit
		const l_bankroller_balance = -user_profit + channel.bankroller_deposit

		if (l_player_balance!=player_balance || l_bankroller_balance!=bankroller_balance) {
			console.error('Invalid profit',{
				l_player_balance     : l_player_balance,
				player_balance       : player_balance,
				l_bankroller_balance : l_bankroller_balance,
				bankroller_balance   : bankroller_balance,
			})
			this.response(params, { error:'Invalid profit' }, response_room)
			return
		}


		const gasLimit = 4600000
		console.log('Send close channel trancsaction')
		console.log('⛽ gasLimit:', gasLimit)

		const receipt = await this.PayChannel().methods
			.closeByConsent(
				channel_id,
				player_balance,
				bankroller_balance,
				session,
				bool,
				signed_args,
			).send({
				gas      : gasLimit,
				gasPrice : 1.2 * _config.gasPrice,
				from     : _openkey,
			})
			.on('transactionHash', transactionHash=>{
				console.log('# closechannel TX pending', transactionHash)
				console.log('https://ropsten.etherscan.io/tx/'+transactionHash)
				console.log('⏳ wait receipt...')
			})
			.on('error', err=>{ 
				console.warn('Close channel error', err)
				this.response(params, { error:'cant close channel', more:err }, response_room)
			})

		console.log('Close channel receipt', receipt)
		if (receipt.transactionHash) {
			this.users[params.user_id].logic.payChannel.reset()
			delete this.users[params.user_id].paychannel
		}

		this.response(params, { receipt:receipt }, response_room)
	}

	_updateState(params, callback=false) {

		const response_room      = this.users[params.update_args.player_address].room
		const channel_id         = params.update_args.channel_id
		const player_address     = params.update_args.player_address
		const player_balance     = params.update_args.player_balance
		const bankroller_balance = params.update_args.bankroller_balance
		const session            = params.update_args.session
		const signed_args        = params.update_args.signed_args

		const rec_openkey = web3.eth.accounts.recover( Utils.sha3(channel_id, player_balance, bankroller_balance, session), signed_args )

		
		if (player_address!=rec_openkey) {
			console.error('🚫 invalid sig on open channel', rec_openkey)
			this.response(params, { error:'Invalid sig' }, response_room)
			return
		}


		const signed_bankroller = Account.signHash(DCLib.Utils.sha3(channel_id, player_balance, bankroller_balance, session))

		this.response(params, {signed_bankroller:signed_bankroller}, response_room)

	}

	_breakConnetion(params, callback=false) { console.log('player disconnected') }

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
