import _config from 'app.config'

const storename = 'GamesStat'

let _stat = {}

export default new class GamesStat {
	constructor() {
		if (process.env.NODE_ENV !== 'server') {
			require('ydn.db')
			this.DB = new ydn.db.Storage( _config.db_name )

			this.loadData()
		}
	}

	async loadData(){
		(await this.DB.values(storename)).forEach(item=>{
			if (item.game && item.game.contract_id) {
				_stat[item.game.contract_id] = item
			}
		})
	}

	add(contract_address=false, key, val){
		if (!contract_address) return
		if (!_stat[contract_address]) {
			_stat[contract_address] = {}
		}
		_stat[contract_address][key] = val

		if (this.DB) this.DB.put(storename, _stat[contract_address], contract_address)
	}

	cnt(contract_address, key, num=1){
		if (!_stat[contract_address]) {
			_stat[contract_address] = {}
		}
		if (!_stat[contract_address][key]) {
			_stat[contract_address][key] = 0
		}
		_stat[contract_address][key] += num
	}

	info(contract_address, key=false){
		if (key && _stat[contract_address] && _stat[contract_address][key]) {
			return _stat[contract_address][key]
		}

		if(key){
			return false
		}

		return _stat[contract_address] || {}
	}

	all(){
		return _stat
	}
}
