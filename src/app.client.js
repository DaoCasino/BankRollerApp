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
			this.startChannelsGames()
		}, 1500)
		setTimeout(()=>{
			Games.startMesh()
		}, 3000)
		return
	}


	let view = new View()

	if (window.App) {
		window.App.view = view
		window.Games    = Games

		setTimeout(()=>{
			this.startChannelsGames()
		}, 1500)
		setTimeout(()=>{
			Games.startMesh()
		}, 3000)

	}
})

// Background job's
// require('./app.background.js')
