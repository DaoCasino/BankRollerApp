import Games from 'games'

setTimeout(()=>{
	Games.runUpdateBalance()

	Games.checkDeployTasks()

	Games.runServerConfirm()
	Games.runBlockchainConfirm()
}, 10000)
