import _config from 'app.config'
import View    from 'view/app.view'
import Games   from 'games'
import DB      from 'DB/DB'

import DiceGameChannel from 'dice_gamechannel'
import FlipGameChannel from 'flip_gamechannel'

if (window) {
	window.App = {}
}

document.addEventListener('DOMContentLoaded',()=>{

	runDapps()

	if (typeof DiceGameChannel!='undefined') {
		window.DiceGameChannel = DiceGameChannel
	}

	if (process.env.APP_BUILD_FOR_WINSERVER) {
		setTimeout(()=>{
			Games.startChannelsGames()
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
			Games.startChannelsGames()
		}, 1500)
		setTimeout(()=>{
			Games.startMesh()
		}, 3000)

	}
})

// Background job's
// require('./app.background.js')

// Load DApps
const runDapps = function(){
	let loaded_dapps = []
	const injectScript = function(url){
		console.log('inject', url)
		var script = document.createElement('script')
		script.src = url
		script.onload = script.onreadystatechange = function() {
			console.log('script '+url+' loaded')
		}
		document.body.appendChild(script)
	}

	DB.data.get('DApps').map((dapp, key)=>{
		let dapp_config = JSON.parse(dapp.config) 
		
		let base = '/'
		if (location.port*1 !== 9999) {
			base = 'http://localhost:9999/'
		}

		let script_url = base + 'DApps/' + key +'/'+ dapp_config.run.client
		
		if (loaded_dapps.indexOf(script_url)>-1) {
			return
		}

		loaded_dapps.push(script_url)

		injectScript(script_url)
	})
}
