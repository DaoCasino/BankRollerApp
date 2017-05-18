import $      from 'jquery'
import Games  from 'games'


setTimeout(()=>{
	Games.checkBalances()

	Games.checkTasks()

	Games.runConfirm()
}, 5000)
