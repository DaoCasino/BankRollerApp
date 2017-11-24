import * as Utils from '../utils'

/** max items in history */
const h_max = 100 

/**@ignore */
const deposit = {
 	player_deposit: false,
	bankroller_deposit: false
}
/**@ignore */
const balance = {
	player_balance: 0,
	bankroller_balanceB: 0
}
/**@ignore */
let _profit  = 0
/** Game history  */
let _history = []


export default class PayChannel {
	constructor(bankroller_deposit) {
		deposit.bankroller_deposit = bankroller_deposit

		console.groupCollapsed('payChannel injected in DApp logic')
		console.log('Now your logic has methods for work with payment channel')
		console.table({
			getDeposit : 'for get start deposit',
			getBalance : 'current user balance',
			getProfit  : 'How many user up, balance-deposit',

			addTX : 'Change current user balance, ex: addTX(-1) ',

			printLog: 'console.log channel state'
		})
		console.groupEnd()
	}
	
	
	setDeposit(d){

		if (deposit.player_deposit!==false) {
			console.error('Deposit allready set')
			return
		}

		deposit.player_deposit = Utils.bet2dec(d)

		balance.player_balance = (1*deposit.player_deposit)
		balance.bankroller_balance = (1*deposit.bankroller_deposit)
		
		console.log('PayChannel::User deposit set '+deposit.player_deposit+' bankroller deposit set' + deposit.bankroller_deposit +', now user balance:', deposit.player_balance)
		return balance
	}

	getDeposit(){ 
		console.log('PayChannel::getDeposit', deposit.player_deposit)
		return Utils.dec2bet(deposit.player_deposit) 
	}

	getBalance(){ 
		console.log('PayChannel::getBalance', balance.player_balance)
		return Utils.dec2bet(balance.player_balance) 
	}

	getBankrollBalance() {
		console.log('PayChannel::getBankrollBalance', balance.bankroller_balance)
		return Utils.dec2bet(balance.bankroller_balance)
	}
	
	
	getProfit(){ 
		console.log('PayChannel::getProfit')
		return Utils.dec2bet(_profit)  
	}
	
	_getProfit(){ 
		console.log('PayChannel::_getProfit')
		return _profit 
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
		balance.player_balance = deposit.player_deposit + _profit
		balance.bankroller_balance = deposit.bankroller_deposit - _profit
		
		console.log('@@@@@@@@@@@@@@@@@@@@@@', _profit, deposit.player_deposit, deposit.bankroller_deposit, balance.bankroller_balance)


		_history.push({
			profit    : p,
			balance   : balance.player_balance,
			timestamp : new Date().getTime(),
		})

		_history = _history.splice(-h_max)
		return Utils.dec2bet(_profit)  
	}

	printLog(){
		console.groupCollapsed('Paychannel state:')
		console.table({
			Deposit : this.getDeposit() ,
			Balance : this.getBalance() ,
			Profit  : this.getProfit()  ,
			Bankroll: this.getBankrollBalance()
		})
		console.groupCollapsed('TX History, last '+h_max+' items '+_history.length)
		console.log(_history)
		console.groupEnd()
		console.groupEnd()

		return _history
	}

	reset(){
		console.log('PayChannel::reset, set deposit balance profit to 0')
		deposit.player_deposit = false
		deposit.bankroller_deposit = false
		balance.player_balance = 0
		balance.bankroller_balance = 0
		_profit  = 0
		_history.push({reset:true, timestamp:new Date().getTime()})
	}
}