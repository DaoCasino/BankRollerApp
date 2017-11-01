
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

const WEB3 = require('web3/packages/web3')
const web3 = new WEB3( new WEB3.providers.HttpProvider(_config.rpc_url) )

import * as Utils from '../utils'


let loaded_dapps = []
const injectDAppScript = function(key, url){
	if (typeof document === 'undefined') {
		return
	}

	const script_id = 'daap_script_'+key

	let old_script = document.getElementById(script_id)
	if (old_script) {
		document.body.removeChild(old_script)
	}

	setTimeout(()=>{
		var script = document.createElement('script')
		script.id  = script_id
		script.src = url
		script.onload = script.onreadystatechange = function() {
			//console.log('script '+url+' loaded')
		}
		document.body.appendChild(script)
	}, 1000)
}




/*
 * Lib constructor
 */ 
class _DCLib {
	constructor() {
		this.Account = Account
		this.web3    = web3
		this.Utils   = Utils
		this.DApp    = DApp
	}

	numFromHash(random_hash, min=0, max=100) {
		if (min > max) { let c = min; min = max; max = c }
		if (min==max) return max
	
		max++
		return Utils.bigInt(random_hash,16).divmod(max-min).remainder.value + min
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

		console.log('get DApps info')
		fetch(_config.server+'/DApps/info/')
			.then( r => { return r.json() })
			.then( info => {
				console.log(info)
			})
	}


	start(){
		this.loadAll()
	}

	remove(key, callback){
		fetch(_config.server+'/DApps/remove/'+key).then( r => {
			delete(this.List[key])
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

		let client_script_url = base + 'DApps/' + key +'/'+ this.List[key].config.run.client

		if (!reload && loaded_dapps.indexOf(client_script_url)>-1) {
			return
		}

		loaded_dapps.push(client_script_url)

		injectDAppScript(key, client_script_url)
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