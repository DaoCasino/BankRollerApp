import _config  from 'app.config'
import GunDB    from 'gun'

const DB = new class Database {
	constructor() {
		this.data = GunDB(_config.server+'/gun')
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

window.DB = DB

export default DB
