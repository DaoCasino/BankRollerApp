import Games from 'games'

if (!window) {
	window = {}
};
setTimeout(()=>{
	Games.runUpdateBalance()

	Games.checkDeployTasks()

	Games.runServerConfirm()
	Games.runBlockchainConfirm()
}, 10000)
