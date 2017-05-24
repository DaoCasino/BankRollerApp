import _config from 'app.config'
import View    from 'view/app.view'
import Games   from 'games'

document.addEventListener('DOMContentLoaded',()=>{
	let view = new View()

	setTimeout(()=>{
		Games.checkTasks()
		Games.runConfirm()
	}, 5000)

})
