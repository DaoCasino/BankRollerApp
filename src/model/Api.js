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
}

export default new Api( _config.api_url )
