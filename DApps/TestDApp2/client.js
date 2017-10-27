window.MyDApp2 = (function(){

	return new DCLib.DApp({
		code  : 'test_v2',
		
		logic : function(){
			var balance = 0
			var history = []

			var setBalance = function(deposit){
				balance = deposit*1
				return balance
			}

			var getBalance = function(){ 
				return balance 
			}

			var Roll = function(user_bet, user_num, random_hash){
				let profit = -user_bet
				
				const random_num = DCLib.Utils.bigInt(random_hash,16).divmod(65536).remainder.value
				
				if (user_num > random_num) {
					profit = (user_bet * (65536 - 1310) / user_num) - user_bet
				}
				if (user_num == random_num) {
					profit = user_bet
				}

				balance += profit*1

				const roll_item = {
					user_bet    : user_bet,
					profit      : profit,
					user_num    : user_num,
					balance     : balance,
					random_hash : random_hash,
					random_num  : random_num,
				}

				history.push(roll_item)

				return roll_item
			}

			return {
				setBalance: setBalance,
				getBalance: getBalance,
				roll:       Roll,
			}
		}
	})

})()



