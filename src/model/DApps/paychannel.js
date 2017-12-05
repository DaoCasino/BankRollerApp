import * as Utils from '../utils'

/** max items in history */
const h_max = 100 

/**@ignore */
const deposit = {
 	player     : false ,
	bankroller : false
}
/**@ignore */
const balance = {
	player     : 0 ,
	bankroller : 0
}
/**@ignore */
let _profit  = 0
/** Game history  */
let _history = []


export default class PayChannel {
	constructor(bankroller_deposit) {
		deposit.bankroller = bankroller_deposit

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
	
	
	setDeposit(d){

		if (deposit.player!==false) {
			console.error('Deposit allready set')
			return
		}

		deposit.player     = Utils.bet2dec(d)
		balance.player     = (1*deposit.player)
		balance.bankroller = (1*deposit.bankroller)
		
		console.log('PayChannel::User deposit set '+deposit.player+' bankroller deposit set' +deposit.bankroller+', now user balance:', deposit.player)
		return balance
	}

	getDeposit(){ 
		console.log('PayChannel::getDeposit', deposit.player)
		return Utils.dec2bet(deposit.player) 
	}

	getBalance(){ 
		console.log('PayChannel::getBalance', balance.player)
		return Utils.dec2bet(balance.player) 
	}

	getBankrollBalance() {
		console.log('PayChannel::getBankrollBalance', balance.bankroller)
		return Utils.dec2bet(balance.bankroller)
	}
	
	
	getProfit(){ 
		console.log('PayChannel::getProfit', _profit)
		return Utils.dec2bet(_profit)  
	}
	
	_getProfit(){ 
		console.log('PayChannel::_getProfit', _profit)
		return _profit 
	}
	
	updateBalance(p, convert=true){
		return this.addTX
	}
	addTX(p, convert=true){
		console.log('PayChannel::addTX')
		if (convert) {
			p = Utils.bet2dec(p)
			console.log('PayChannel::addTX - convert BET to minibet', p)
		}
		if ((''+p).indexOf('.') > -1) {
			throw new Error('addTX '+p+' invalid value, set convert param to true')
		}

		_profit += p*1
		balance.player     = deposit.player     + _profit
		balance.bankroller = deposit.bankroller - _profit

		_history.push({
			profit    : p                    ,
			balance   : balance.player       ,
			timestamp : new Date().getTime()
		})

		_history = _history.splice(-h_max)
		return Utils.dec2bet(_profit)  
	}

	printLog(){
		console.groupCollapsed('Paychannel state:')
		console.table({
			Deposit          : this.getDeposit()         ,
			Player_balance   : this.getBalance()         ,
			Bankroll_balance : this.getBankrollBalance() ,
			Profit           : this.getProfit()
		})
		console.groupCollapsed('TX History, last '+h_max+' items '+_history.length)
		console.log(_history)
		console.groupEnd()
		console.groupEnd()

		return _history
	}

	reset(){
		console.log('PayChannel::reset, set deposit balance profit to 0')
		deposit.player     = false
		deposit.bankroller = false
		balance.player     = 0
		balance.bankroller = 0
		_profit            = 0
		_history.push({reset:true, timestamp:new Date().getTime()})
	}
}