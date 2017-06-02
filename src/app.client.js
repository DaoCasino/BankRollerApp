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

	// setInterval(()=>{
	// 	let test_seed = '0x14963965039618f89a0d8a00af57fe504dc40e2dc241276b065abb83636d14d0'
	// 	Games.getConfirmNumber(test_seed, (confirm, PwDerivedKey, v,r,s)=>{
	// 		console.log( 'confirm:'+confirm+' V-R-S:'+v+'-'+r+'-'+s )
	// 		// console.log(confirm, PwDerivedKey, v,r,s)
	// 	})
	// }, 5000)

})

// Background job's
// require('./app.background.js')
