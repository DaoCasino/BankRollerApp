/**
 * Define our DApp logic constructor,
 * for use it in frontend and bankroller side
 */

/* global DCLib */
DCLib.defineDAppLogic('dicetest_v11', function () {
	const _self = this

	const MAX_RAND_NUM = 65535
	const HOUSEEDGE    = 0.02 // 2%

	let history = []

	var Roll = function (user_bet, user_num, random_hash) {
		// convert 1BET to 100000000
		user_bet = DCLib.Utils.bet2dec(user_bet)

		// generate random number
		const random_num = DCLib.numFromHash(random_hash, 0, MAX_RAND_NUM)

		let profit = -user_bet
		// if user win
		if (user_num >= random_num) {
			profit = (user_bet * (MAX_RAND_NUM - MAX_RAND_NUM * HOUSEEDGE) / user_num) - user_bet
		}

		// add result to paychannel
		_self.payChannel.addTX(DCLib.Utils.dec2bet(profit), true)
		_self.payChannel.printLog()

		// push all data to our log
		// just for debug
		const roll_item = {
			timestamp   : new Date().getTime(),
			user_bet    : user_bet,
			profit      : profit,
			user_num    : user_num,
			balance     : _self.payChannel.getBalance(),
			random_hash : random_hash,
			random_num  : random_num
		}
		history.push(roll_item)

		return roll_item
	}

	return {
		roll    : Roll,
		history : history
	}
})
