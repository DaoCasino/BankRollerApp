/*
 * Wrapper for JSON-RPC Ethereum API
 * https://github.com/ethereum/wiki/wiki/JSON-RPC
 *
 * Example usage:
 *    ETH.request('sendRawTransaction', [params]).then( response => {
 *	     ...
 *    }).catch(err => { consle.error(err) })
 *
 **/


export default class ethRPC {
	constructor(provider_url){
		this.provider_url = provider_url
	}

	request(method_name=false, params=[], id=1){
		return new Promise((resolve, reject) => {
			try	{
				let res = this.callMethod(method_name, params, id, (response)=>{
					if (response && !response.error) {
						resolve( response )
					} else {
						reject( response )
					}
				})
				if (res===false) {
					reject( 'empty method' )
				}
			} catch(e){
				reject(e)
			}
		})
	}

	callMethod(method_name=false, params=[], id=1, callback=false){
		if (!method_name) {
			return false
		}

		fetch(this.provider_url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: JSON.stringify({
				'id':      id,
				'jsonrpc': '2.0',
				'method':  'eth_'+method_name,
				'params':  params
			})
		}).then( response => {
			return response.json()
		}).then( obj => {
			if (obj.error) {
				console.info(method_name, params)
				console.error(obj)
			}
			callback( obj )
		}).catch( err => {
			console.info(method_name, params)
			console.error(err)
			callback( err )
		})
	}

}

