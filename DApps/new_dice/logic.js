/* global DCLib */
DCLib.defineDAppLogic('new_dicegame', function () {
	const _self = this

	const MAX_RAND_NUM = 65535
	const HOUSEEDGE    = 0.02 // 2%

	let history = []

	var Roll = function (userBet, userNum, randomHash) {
		// convert 1BET to 100000000
		userBet = DCLib.Utils.bet2dec(userBet)
		// generate random number
		const randomNum = DCLib.numFromHash(randomHash, 0, MAX_RAND_NUM)

		let profit = -userBet
		// if user win
		if (userNum >= randomNum) {
			profit = (userBet * (MAX_RAND_NUM - MAX_RAND_NUM * HOUSEEDGE) / userNum) - userBet
		}
		// add result to paychannel
		_self.payChannel.addTX(DCLib.Utils.dec2bet(profit), true)
		_self.payChannel.printLog()

		// push all data to our log
		// just for debug
		const rollItem = {
			timestamp   : new Date().getTime(),
			user_bet    : userBet,
			profit      : profit,
			user_num    : userNum,
			balance     : _self.payChannel.getBalance(),
			random_hash : randomHash,
			random_num  : randomNum
		}
		history.push(rollItem)

		return rollItem
	}

	return {
		roll: Roll,
		history: history
	}
})
