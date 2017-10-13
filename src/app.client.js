// import _config from 'app.config'
import View    from 'view/app.view'
import DApps   from 'DApps'

if (window) {
	window.App = {}
}

document.addEventListener('DOMContentLoaded',()=>{

	// Start loaded daaps games
	DApps.start()

	if (process.env.APP_BUILD_FOR_WINSERVER) {
		return
	}

	let view = new View()

	if (window.App) {
		window.App.view  = view
		window.App.DApps = DApps
	}
})
