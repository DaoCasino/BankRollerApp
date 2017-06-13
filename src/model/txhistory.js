import _config  from 'app.config'
import DB  from 'DB/DB'
import Eth from 'Eth/Eth'

const DBtxhistory = DB.data.get('txhistory7')

let _history = {}

export default new class TXHistory {
	constructor() {
		DBtxhistory.map().on( (item, hash) => {
			_history[hash] = item
		} )

		this.load()
		setInterval(()=>{
			this.load()
		}, 60*1000)
	}

	load(callback){
		let tx_url = 'http://'+_config.network+'.etherscan.io/api?module=account&action=txlist&address=' + Eth.Wallet.get().openkey +'&startblock=0&endblock=latest'

		fetch(tx_url).then( r => {
			return r.json()
		}).then( r=>{
			if (!r.result) { return }
			let txs = r.result.reverse()


			for(let k in txs){
				let tx = txs[k]

				if (!(tx.value*1)) { continue }

				if (!this.find(tx.hash)) {
					this.add({
						time:   tx.timeStamp*1000,
						out:    !(tx.to==Eth.Wallet.get().openkey),
						tokens: false,
						tx:     tx.hash,
						to:     tx.to,
						amount: tx.value/1000000000000000000,
					})
				}
			}
		})

	}

	add(data){
		if (!data.time ) {
			data.time = new Date().getTime()
		}

		_history[data.tx] = data
		DBtxhistory.get(data.tx).put( _history[data.tx] )
	}

	get(){
		let history = []
		for(let k in _history){
			_history[k].time = new Date( _history[k].time ).toString()
			history.push( _history[k] )
		}

		return history.sort(function(a, b){
			if(a.time > b.time) return -1
			if(a.time < b.time) return 1
			return 0
		})
	}

	find(hash){
		return _history[hash]
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
