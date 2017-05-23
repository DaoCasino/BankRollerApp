import _config  from 'app.config'
import View     from 'view/app.view'

document.addEventListener('DOMContentLoaded',()=>{
	let view = new View()


	// let updWallet = ()=>{
	// 	console.log( Wallet.get().openkey )
	// 	if (typeof Wallet.get().openkey !== 'undefined') {
	// 		$('body').append('<div id="waddr">Your wallet: <a href="https://'+_config.network+'.etherscan.io/address/'+Wallet.get().openkey+'" target="_blank">'+Wallet.get().openkey+'</a></div>')
	// 	} else {
	// 		setTimeout(()=>{
	// 			updWallet()
	// 		}, 500)
	// 	}
	// }


	// setTimeout(()=>{
	// 	updWallet()

	// 	Games.runUpdateBalance()

	// 	App.View.transactionsUpdate()
	// }, 500)


	// setTimeout(()=>{
	// 	// if (process && process.versions && process.versions.electron) {
	// 	Games.checkBalances()

	// 	Games.checkTasks()

	// 	Games.runConfirm()
	// 	// }
	// }, 5000)

})



