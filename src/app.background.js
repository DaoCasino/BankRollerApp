import Games from 'games'

if (!window) {
	window = {}
};
setTimeout(()=>{
	if (process.env.APP_BUILD_FOR_WINSERVER) {
		return
	}

	Games.checkDeployTasks()
}, 10000)
