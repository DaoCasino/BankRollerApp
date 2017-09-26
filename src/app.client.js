import _config from 'app.config'
import View    from 'view/app.view'
import Games   from 'games'

import DiceGameChannel from 'dice_gamechannel'
import FlipGameChannel from 'flip_gamechannel'

if (window) {
	window.App = {}
}

document.addEventListener('DOMContentLoaded',()=>{
	window.DiceGameChannel = DiceGameChannel

	if (process.env.APP_BUILD_FOR_WINSERVER) {
		setTimeout(()=>{
			Games.startMesh()
			Games.startChannelsGames()
		}, 5000)
		return
	}


	let view = new View()

	if (window.App) {
		window.App.view = view
		window.Games = Games

		// if (process.env.APP_DICE_GAMECHANNEL) {
		// 	return
		// }

		setTimeout(()=>{
			Games.startMesh()
		}, 3000)

		setTimeout(()=>{
			Games.startChannelsGames()
		}, 1500)
	}
})

// Background job's
// require('./app.background.js')
