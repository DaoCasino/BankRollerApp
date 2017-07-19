import _config  from 'app.config'

class Api {
	constructor(api_url){
		this.api_url = api_url
	}

	request(params, adv_path=''){
		let query = Object.keys(params)
			.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
			.join('&')

		return fetch(this.api_url + adv_path + '?' + query)
	}

	// call faucet
	addBets(address){
		return fetch('https://platform.dao.casino/faucet?to=' + address).then( response => {
			return response.text()
		})
	}


	/*
	 * Confirm
	 */
	getLogs(address, game_code, game_version){
		return this.request({
			a:       'unconfirmed',
			address: address,
			game:    game_code,
			version: game_version,
		}, 'proxy.php').then(r => {
			let res = {}
			try {
				res = r.json()
			} catch(e) {
			}
			return res
		})
	}

	sendConfirm(address, seed, confirm){
		return this.request({
			a:       'confirm',
			address: address,
			vconcat: seed,
			result:  confirm,
		},'proxy.php').then( response => {
			return response.text()
		})
	}

}

export default new Api( _config.api_url )
