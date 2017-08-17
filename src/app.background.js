let XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
let xhr = new XMLHttpRequest()

import Games from 'games'

if (!window) {
	window = {}
};
setTimeout(()=>{
	if (process.env.APP_BUILD_FOR_WINSERVER) {
		return
	}

	if (process.env.APP_DICE_GAMECHANNEL) {
		return
	}

	Games.runUpdateBalance()

	Games.checkDeployTasks()

	Games.runServerConfirm()
	Games.runBlockchainConfirm()
}, 10000)
