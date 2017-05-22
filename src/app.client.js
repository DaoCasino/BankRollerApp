import $        from 'jquery'
import _config  from 'app.config'
import {Wallet} from 'Eth/Eth'
import Games    from 'games'
import View     from 'view/app.view'


document.addEventListener('DOMContentLoaded',()=>{
	// for debug
	if (_config.mode='dev') {
		window.App = {
			Games:   Games,
			Wallet:  Wallet,
			_config: _config,
			View:    View
		}
	}

	// Get games contracts
	console.group('Get games')

	Games.get((games)=>{
		console.log(games)

		View.renderGamesList(games)
		View.loading(false)

		console.groupEnd()
	})

	// Deploy new game contract
	let gamelist_upd_interval = false
	View.onGameAdd((game_name)=>{
		View.loading(true, 'Add task to deploy  "'+game_name+'" contract')

		Games.create('dice',(address)=>{
			clearInterval(gamelist_upd_interval)
			gamelist_upd_interval = setInterval(()=>{
				Games.get((games)=>{
					View.loading(false)
					View.renderGamesList(games)
				})
			}, 2000)
		})
	})

	// Add new game contract
	View.onContractAdd((contract_id)=>{
		View.loading(true, 'Add game contract...')

		Games.add(contract_id, (info)=>{
			console.info('Game added', info)
			View.loading(true, 'Game added!')
			setTimeout(()=>{
				Games.get((games)=>{
					View.loading(false)
					View.renderGamesList(games)
				})
			},2000)
		})
	})

	let updWallet = ()=>{
		console.log( Wallet.get().openkey )
		if (typeof Wallet.get().openkey !== 'undefined') {
			$('body').append('<div id="waddr">Your wallet: <a href="https://'+_config.network+'.etherscan.io/address/'+Wallet.get().openkey+'" target="_blank">'+Wallet.get().openkey+'</a></div>')
		} else {
			setTimeout(()=>{
				updWallet()
			}, 500)
		}
	}


	setTimeout(()=>{
		updWallet()

		Games.runUpdateBalance()

		View.transactionsUpdate()
	}, 500)


	/*setTimeout(()=>{
		// if (process && process.versions && process.versions.electron) {
			Games.checkBalances()

			Games.checkTasks()

			Games.runConfirm()
		// }
	}, 5000)*/

})



