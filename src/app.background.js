import Games from 'games'

setTimeout(()=>{
	Games.checkTasks()
	Games.runConfirm()
	setTimeout(()=>{
		Games.runUpdateBalance()
	}, 5000)
}, 5000)
