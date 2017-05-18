import _config from 'app.config'

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


	getLogs(address){
		return this.request({a:'unconfirmed', address:address}, 'proxy.php').then(r => {
			return r.json()
		})
	}

	addBets(address){
		return this.request({
			a:       'faucet',
			to:      address,
			network: _config.network,
		}).then( response => {
			return response.text()
		})
	}

	sendConfirm(seed, confirm){
		return this.request({
			a:       'confirm',
			vconcat: seed,
			result:  confirm,
		},'proxy.php').then( response => {
			return response.text()
		})
	}

}

export default new Api( _config.api_url )
