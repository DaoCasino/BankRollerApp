import * as Utils from '../utils'

/** max items in history */
const h_max = 100 

// /**@ignore */
// const deposit = {
//  	player     : false ,
// 	bankroller : false
// }
// /**@ignore */
// const balance = {
// 	player     : 0 ,
// 	bankroller : 0
// }
// /**@ignore */
// let _profit  = 0
// /** Game history  */
// let _history = []


export default class PayChannel {
	constructor(bankroller_deposit) {

		this.bankroller_deposit = bankroller_deposit
		this.player_deposit     = false
		this.bankroller_balance = 0
		this.player_balance     = 0
		this.profit             = 0
		this.history            = []
		this.h_max              = 100

		console.groupCollapsed('payChannel injected in DApp logic')
		console.log('Now your logic has methods for work with payment channel')
		console.table({
			getDeposit : 'for get start deposit'                       ,
			getBalance : 'current user balance'                        ,
			getProfit  : 'How many user up, balance-deposit'           ,

			addTX      : 'Change current user balance, ex: addTX(-1) ' ,

			printLog   : 'console.log channel state'
		})
		console.groupEnd()
	}

	setDepositBankroll(d) {
		console.log('Set Deposit bankroll', d)
		this.bankroller_deposit = d
	}
	
	
	setDeposit(d){
		console.log('@DEPOSIT', this.player_deposit)
		if (this.player_deposit!==false) {
			console.error('Deposit allready set')
			return
		}

		this.player_deposit     = Utils.bet2dec(d)
		this.player_balance     = (1*this.player_deposit)
		this.bankroller_balance = (1*this.bankroller_deposit)
		
		console.log('PayChannel::User deposit set '+this.player_deposit+' bankroller deposit set ' +this.bankroller_deposit+', now user balance:', this.player_deposit)
		return this.player_deposit
	}

	getDeposit(){ 
		console.log('PayChannel::getDeposit', this.player_deposit)
		return Utils.dec2bet(this.player_deposit) 
	}

	getBalance(){ 
		console.log('PayChannel::getBalance', this.player_balance)
		return Utils.dec2bet(this.player_balance) 
	}

	getBankrollBalance() {
		console.log('PayChannel::getBankrollBalance', this.bankroller_balance)
		return Utils.dec2bet(this.bankroller_balance)
	}
	
	
	getProfit(){ 
		console.log('PayChannel::getProfit', this.profit)
		return Utils.dec2bet(this.profit)  
	}
	
	_getProfit(){ 
		console.log('PayChannel::_getProfit', this.profit)
		return this.profit 
	}
	
	updateBalance(p, convert=true){
		return this.addTX
	}

	addTX(p, convert=true){
		console.log('PayChannel::addTX', p)
		if (convert) {
			p = Utils.bet2dec(p)
			console.log('PayChannel::addTX - convert BET to minibet', p)
		}
		if ((''+p).indexOf('.') > -1) {
			throw new Error('addTX '+p+' invalid value, set convert param to true')
		}

		this.profit += p*1
		this.player_balance     = this.player_deposit     + this.profit
		this.bankroller_balance = this.bankroller_deposit - this.profit

		this.history.push({
			profit    : p                    ,
			balance   : this.player_balance  ,
			timestamp : new Date().getTime()
		})

		this.history = this.history.splice(-this.h_max)
		return Utils.dec2bet(this.profit)  
	}

	getHistory() {
		console.log('Get history', this.history)
		return this.history
	}

	printLog(){
		console.groupCollapsed('Paychannel state:')
		console.table({
			Deposit          : this.getDeposit()         ,
			Player_balance   : this.getBalance()         ,
			Bankroll_balance : this.getBankrollBalance() ,
			Profit           : this.getProfit()
		})
		console.groupCollapsed('TX History, last '+this.h_max+' items '+this.history.length)
		console.log(this.history)
		console.groupEnd()
		console.groupEnd()

		return this.history
	}

	reset(){
		console.log('PayChannel::reset, set deposit balance profit to 0')
		this.player_deposit     = false
		this.bankroller_deposit = false
		this.player_balance     = 0
		this.bankroller_balance = 0
		this.profit             = 0
		this.history.push({reset:true, timestamp:new Date().getTime()})
	}
}