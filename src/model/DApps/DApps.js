
import _config  from 'app.config'
import DB       from 'DB/DB'
import Eth      from 'Eth/Eth'
import Rtc      from 'rtc'
import DApp     from './DApp'
import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'

import printDocs from './docs'

// for dapps
import Wallet from 'Eth/Wallet'
const Account = new Wallet()

import * as Utils from '../utils'


let loaded_dapps = []
const injectDAppScript = function(key, url, callback){
	if (typeof document === 'undefined') {
		return
	}

	const script_id = 'daap_script_'+key

	let old_script = document.getElementById(script_id)
	if (old_script) {
		document.body.removeChild(old_script)
	}

	setTimeout(()=>{
		var script  = document.createElement('script')
		script.id   = script_id
		script.src  = url

		script.onload = script.onreadystatechange = function() {
			//console.log('script '+url+' loaded')
			callback()
		}
		document.body.appendChild(script)
	}, 1000)
}


const EthHelpers = class EthHelpers {
	constructor(acc,web3,erc20) {
		this.Account = acc
		this.web3    = web3
		this.ERC20   = erc20
	}


	async getBalances(address, callback=false){
		const [bets, eth] = await Promise.all([
			this.getBetBalance( address ),
			this.getEthBalance( address )
		])

		const res = { bets:bets, eth:eth }
		
		if (callback) callback( res )
		return res
	}

	getEthBalance(address=false, callback=false){
		address = address || this.Account.get().openkey
		if (!address) return
		
		return new Promise((resolve, reject) => {

			this.web3.eth.getBalance(address).then(value => {
				const balance = this.web3.utils.fromWei(value)
				resolve( balance )
				if(callback) callback( balance )
			}).catch( err => {
				console.error(err)
				reject(err)
			})
		})
	}

	getBetBalance(address=false, callback=false){
		address = address || this.Account.get().openkey
		if (!address) return
		
		return new Promise((resolve, reject) => {
			
			this.ERC20.methods.balanceOf(address).call().then( value => {
				const balance = Utils.bet2dec(value) 
				resolve( balance )
				if(callback) callback( balance )
			}).catch( err => {
				console.error(err)
				reject(balance)
			})
		})
	}
}


/*
 * Lib constructor
 */ 
class _DCLib {
	constructor() {
		this.Account = Account
		this.web3    = Account.web3
		this.Utils   = Utils
		this.DApp    = DApp
		
		// Init ERC20 contract
		this.ERC20 = new this.web3.eth.Contract(
			_config.contracts.erc20.abi, 
			_config.contracts.erc20.address 
		)
		
		this.Eth = new EthHelpers(Account, Account.web3, this.ERC20)
	}

	/**
	 * Define DApp logic constructor function
	 * @param {string} dapp_code         unique code of your dapp
	 * @param {function} logic_constructor constructor Dapp logic
	 */
	defineDAppLogic(dapp_code, logic_constructor){
		let G = window || global

		if (!G.DAppsLogic) {
			G.DAppsLogic = {}
		}

		G.DAppsLogic[dapp_code] = logic_constructor
	}

	randomHash(){
		return this.Account.sign( Utils.makeSeed() ).messageHash
	}

	numFromHash(random_hash, min=0, max=100) {
		if (min > max) { let c = min; min = max; max = c }
		if (min==max) return max

		if (random_hash.length > 3 && random_hash.substr(0,2)=='0x' ) {
			random_hash = random_hash.substr(2)
		}

		max++
		return Utils.bigInt(random_hash,16).divmod(max-min).remainder.value + min
	}

	sigRecover(raw_msg, signed_msg){
		raw_msg = Utils.remove0x(raw_msg)
		return this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase()
	}
	
	sigHashRecover(){
		return this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase()
	}
	
	checkSig(raw_msg, signed_msg, need_address){		
		raw_msg = Utils.remove0x(raw_msg)
		return ( need_address.toLowerCase() == this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase() )
	}
	checkHashSig(raw_msg, signed_msg, need_address){		
		return ( need_address.toLowerCase() == this.web3.eth.accounts.recover(raw_msg, signed_msg).toLowerCase() )
	}
}


export default new class DAppsAPIInit {
	constructor() {
		this.List = {}

		// export local API methods 
		// to globals 
		let G = window || global
		G.DCLib = new _DCLib()
		
		printDocs( G.DCLib )

		fetch(_config.server+'/DApps/info/')
			.then( r => { return r.json() })
			.then( info => {
				this.info = info
			})
	}


	start(){
		this.loadAll()
	}

	remove(key, callback){
		fetch(_config.server+'/DApps/remove/'+key).then( r => {
			Object.keys(this.List).forEach(d=>{
				if ( d.toLowerCase() === key.toLowerCase() ) {
					delete(this.List[d])
				}
			})
			callback()
		})
	}

	loadAll(){
		fetch(_config.server+'/DApps/list/').then( r => { return r.json() }).then( list => {
			this.List = Object.assign({},list)
			Object.keys(list).forEach( key => {
				this.loadDApp(key)
			})
		})
	}

	loadDApp(key, reload=false){
		if (!this.List[key]) return

		let base = '/'
		if (location && location.port*1 !== 9999) {
			base = 'http://localhost:9999/'
		}

		let logic_script_url  = base + 'DApps/' + key +'/'+ this.List[key].config.logic
		let client_script_url = base + 'DApps/' + key +'/'+ this.List[key].config.run.client

		this.List[key].frontend_url = base + 'DApps/' + key +'/'+ this.List[key].config.index

		if (!reload && loaded_dapps.indexOf(client_script_url)>-1) {
			return
		}

		loaded_dapps.push(client_script_url)

		injectDAppScript(key+'_logic', logic_script_url, function(){
			injectDAppScript(key, client_script_url, function(){})
		})
	}


	upload(e, callback){
		let manifest_finded = false

		const uploadFolder = function(file, path){
			fetch(_config.server+'/upload_game/',{
				method : 'POST',
				body   :  JSON.stringify({ manifest: {
					name : file.name,
					path : file.path || path,
				} })
			}).then(r=>{
				return r.json()
			}).then(json => {
				callback(json)
			}).catch(err=>{
				callback(err)
			})
		}


		const findManifest = function(item, path) {
			if (!item || manifest_finded) {
				return
			}

			path = path || ''
			if (item.isFile) {
				item.file(file => {
					if (file.name=='dapp.manifest') {
						manifest_finded = true

						uploadFolder(file, path)
						
						return
					}
				})
				return
			}

			if (item.isDirectory) {
				item.createReader().readEntries(function(entries) {
					for (let i=0; i < entries.length; i++) {
						findManifest(entries[i], path + item.name + '/')
					}
				})
			}
		}

		const items = event.dataTransfer.items

		for (let i=0; i < items.length; i++) {
			if (manifest_finded) { break }

			findManifest( items[i].webkitGetAsEntry() )
		}

		setTimeout(()=>{
			if (!manifest_finded) {
				callback({error:'Cant find manifest file ( ./dapp.manifest )' })
			};
		}, 5000)
	}
}