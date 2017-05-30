import _config  from 'app.config'


const DB = new class Database {
	constructor() {
		// Webpack automatic remove not used code
		// and there will be only one expression

		if (process.env.NODE_ENV !== 'server') {
			this.data = require('gun')(_config.server+'/gun')
		}

		if (process.env.NODE_ENV === 'server') {
			this.data = GunDB
		}
	}

	// localforage compatibility
	getItem(key, callback){
		this.data.get(key, ack => {
			if(!ack.put){
				callback('not_found')
			} else {
				callback(null, ack.put)
			}
		})
	}
	setItem(key, data, callback){
		this.data.get(key).put(data, callback)
	}

	removeItem(key){
		this.data.get(key).put(null)
	}
}

export default DB
