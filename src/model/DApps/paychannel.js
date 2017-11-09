import * as Utils from '../utils'

const h_max = 100 // mac items in history

let _deposit = false
let _balance = 0
let _profit  = 0
let _history = []

export default class PayChannel {
	constructor() {
		
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
		if (_deposit!==false) {
			console.error('Deposit allready set')
			return
		}
		_deposit = Utils.bet4dec(d)
		_balance = (1*_deposit)
		
		console.log('PayChannel::User deposit set '+_deposit+', now user balance:', _balance)
		return _balance
	}

	getDeposit(){ 
		console.log('PayChannel::getDeposit')
		return Utils.bet2dec(_deposit) 
	}

	getBalance(){ 
		console.log('PayChannel::getBalance')
		return Utils.bet2dec(_balance) 
	}
	
	getProfit(){ 
		console.log('PayChannel::getProfit')
		return Utils.bet2dec(_profit)  
	}
	
	_getProfit(){ 
		console.log('PayChannel::_getProfit')
		return _profit 
	}

	addTX(p){
		console.log('PayChannel::addTX')
		if ((''+p).indexOf('.')) {
			p = Utils.bet4dec(p)
			console.log('PayChannel::addTX - convert BET to minibet', p)
		}

		_profit += p*1
		_balance = _deposit + _profit
		
		_history.push({
			profit    : p,
			balance   : _balance,
			timestamp : new Date().getTime(),
		})

		_history = _history.splice(-h_max)

		return Utils.bet2dec(_profit)  
	}

	printLog(){
		console.groupCollapsed('Paychannel state:')
		console.table({
			Deposit : this.getDeposit() ,
			Balance : this.getBalance() ,
			Profit  : this.getProfit()  ,
		})
		console.groupCollapsed('TX History, last '+h_max+' items '+_history.length)
		console.log(_history)
		console.groupEnd()
		console.groupEnd()
	}

	reset(){
		console.log('PayChannel::reset, set deposit balance profit to 0')
		_deposit = false
		_balance = 0
		_profit  = 0
		_history.push({reset:true, timestamp:new Date().getTime()})
	}
}