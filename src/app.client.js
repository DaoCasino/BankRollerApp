import _config from 'app.config'
import View    from 'view/app.view'
import Games   from 'games'

if (window) {
	window.App = {}
}

document.addEventListener('DOMContentLoaded',()=>{
	let view = new View()

	if (window.App) {
		window.App.view = view
	}
})

// Background job's
// require('./app.background.js')
