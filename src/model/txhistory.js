import DB from 'DB/DB'

const DBtxhistory = DB.data.get('txhistory')

let _history = {}

export default new class TXHistory {
	constructor() {
		DBtxhistory.map().on( (item, time) => {
			_history[time] = item
		} )
	}

	add(data){
		data.time = new Date().getTime()
		_history[data.time] = data
		DBtxhistory.get(data.time).put( _history[data.time] )
	}

	get(){
		let history = []
		for(let k in _history){
			_history[k].time = new Date(k*1).toString()
			history.push( _history[k] )
		}

		return history.sort(function(a, b){
			if(a.time > b.time) return -1
			if(a.time < b.time) return 1
			return 0
		})
	}

	subscribe(callback){
		DBtxhistory.on(e=>{
			clearTimeout(this.upd_t)
			this.upd_t = setTimeout(()=>{
				callback( this.get() )
			}, 500)
		})
	}
}
