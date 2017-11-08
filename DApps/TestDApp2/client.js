
window.MyDApp2 = (function(){

	const GameLogic = function(){
		var balance = 0
		var deposit = 0
		var profit  = 0
		var history = []

		var setDeposit = function(d){
			deposit = DCLib.Utils.bet4dec(d)
			balance = d*1
			return balance
		}

		var getDeposit = function(){ return DCLib.Utils.bet2dec(deposit) }
		var getBalance = function(){ return DCLib.Utils.bet2dec(balance) }
		var getProfit  = function(){ return DCLib.Utils.bet2dec(profit)  }

		var Roll = function(user_bet, user_num, random_hash){
			let i_profit = -user_bet
			
			const random_num = DCLib.numFromHash(random_hash, 0, 65536)
			console.log(random_num)

			if (user_num > random_num) {
				i_profit = (user_bet * (65536 - 1310) / user_num) - user_bet
			}
			if (user_num == random_num) {
				i_profit = user_bet
			}

			profit += i_profit*1
			balance = deposit + profit

			const roll_item = {
				timestamp   : new Date().getTime(),
				user_bet    : user_bet,
				profit      : i_profit,
				user_num    : user_num,
				balance     : balance,
				random_hash : random_hash,
				random_num  : random_num,
			}

			history.push(roll_item)

			return roll_item
		}

		return {
			__getProfit : getProfit,
			setDeposit  : setDeposit,
			getDeposit  : getDeposit,
			getBalance  : getBalance,
		
			roll    : Roll,
			history : history,
		}
	}

	return new DCLib.DApp({
		code  : 'test_v2',
		logic : GameLogic,
	})

})()



