import _config from 'app.config'
import DB      from 'DB/DB'


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


let loaded_dapps = []

export default new class DApps {
	constructor() {
		this.List = {}
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
				callback(r)
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