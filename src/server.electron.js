const _config = require('./config.electron.js')
const http    = require('http')
const path    = require('path')
const queryp  = require('querystring')
const fs      = require('fs')
const fse     = require('fs-extra')
const Gun     = require('gun')
const watch   = require('node-watch')
const {app}   = require('electron')


const filetypes = {
	'.js':   'text/javascript',
	'.css':  'text/css',
	'.json': 'application/json',
	'.svg':  'image/svg+xml',
	'.png':  'image/png',
	'.jpg':  'image/jpg',
	'.wav':  'audio/wav',
}


/*
 * DApps init
 */

// Find DApps folder for current ENV
let dapps_path = __dirname + _config.dapps_path
if (typeof app != 'undefined') {
	dapps_path = (app.getPath('userData') + _config.dapps_path).split('//').join('/')
	
	if ( /^win/.test(process.platform) ) {
		dapps_path = app.getPath('userData') + '\\DApps\\'
	}
}

const DApps = {
	list:{},

	init:function(dapps_dirs=false, callback=false){
		console.log('initDApps', dapps_dirs)
		if (!dapps_dirs) {	
			try {
				console.log(dapps_path)
				dapps_dirs = fs.readdirSync(dapps_path)
				console.log('dapps_dirs',dapps_dirs)
			} catch(e) {
				return
			}
		}

		dapps_dirs.forEach(dir=>{
			let full_path = dapps_path+dir+'/'
			if ( /^win/.test(process.platform) ) {
				full_path = dapps_path+dir+'\\'
			}

			const dapp_config = this.readManifest( full_path+'dapp.manifest' )
			if (!dapp_config) {
				// console.log('Cant find manifest for ', dir)
				return
			}

			// console.log('dapp_config', dapp_config)
			
			const dapp_data = {
				config : dapp_config,
				path   : full_path,
			}

			this.list[dir] = dapp_data
		
			if (callback) {
				callback(dapp_data)
			}

			if (!dapp_config.run.server) {
				return
			}

			const module_path = full_path + dapp_config.run.server
			// console.log('module_path', module_path)
			require(module_path)
		})

		setInterval(()=>{
			this.readDirs()
		}, 5000)

		this.watchChanges()
	},

	readDirs(){
		this.list = {}
		fse.readdirSync(dapps_path).forEach(dir=>{
			let full_path = dapps_path+dir+'/'
			if ( /^win/.test(process.platform) ) {
				full_path = dapps_path+dir+'\\'
			}

			const dapp_config = this.readManifest( full_path+'dapp.manifest' )
			if (!dapp_config) {
				// console.log('Cant find manifest for ', dir)
				return
			}

			const dapp_data = {
				config : dapp_config,
				path   : full_path,
			}
			this.list[dir] = dapp_data
		})
	},

	readManifest: function(file_path){
		const tryReadFile = (path)=>{	
			try	{
				let dapp_config = JSON.parse(fs.readFileSync(path))	
				if (typeof dapp_config.run !== 'object') {
					let str = ''+dapp_config.run 
					dapp_config.run = {client:str}
				}
				return dapp_config
			} catch(e){
				return false
			}
		}

		return tryReadFile(file_path) || tryReadFile(file_path+'.json')
	},

	upload: function(data, callback){
		let manifest
		for(let k in data){
			try {
				manifest = JSON.parse(k).manifest
				break
			} catch(e) {
				console.log(e)
			}
		}

		const dapp_config = this.readManifest(manifest.path)
		if (!dapp_config) {
			// console.log('cant find manifest')
			return
		}

		let cp_from = manifest.path.split('/').slice(0,-1).join('/')

		if ( /^win/.test(process.platform) ) {
			full_path = manifest.path.split('\\').slice(0,-1).join('\\')
		}

		// callback({
		// 	manpath:    manifest.path,
		// 	from:       
		// 	to:         dapps_path + dapp_config.name,
		// 	dapps_path: dapps_path,
		// })
		// return 

		fse.copySync( 
			cp_from,
			dapps_path + dapp_config.slug 
		)

		this.init([dapp_config.slug], callback )
	},

	remove: function(key, callback){
		Object.keys(this.list).forEach( d => {
			if ( d.toLowerCase() !== key.toLowerCase() ) {
				return
			}

			const full_path = dapps_path+d+'/'
			console.log('!!! Remove folder ', full_path)
			fse.removeSync(full_path)
			delete(this.list[d])
		})
	},

	watchChanges: function(){
		var io = require('socket.io')({origins:'http://localhost:*'})
		io.on('connection', function(client){})
		io.listen(9997)
		console.log('watchChanges in', dapps_path)
		watch(dapps_path, { recursive: true }, function(evt, name) {
			console.log(evt+' '+name)
			io.emit('reload_page', 'filechanged '+name+'')
		})
	},

	serve: function(request, response){

		// Upload game folder
		if (request.method == 'POST' && request.url.indexOf('/upload_game/')>-1) {
			console.log( 'Upload_game...' )

			let body = ''
			request.on('data', function (data) {
				body += data
				console.log('.')
				// Too much POST data, kill the connection!
				// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
				if (body.length > 1e6) { 
					request.connection.destroy()
					console.log('Too much POST data')
				}
			})

			request.on('end', ()=>{
				console.log('Create folder')
				this.upload( queryp.parse(body), (dapp_data)=>{
					response.end(JSON.stringify(dapp_data), 'utf-8')
				})
			})
			return true
		}


		// Get dapps list
		if (request.url.indexOf('DApps/info')>-1) {
			let app_paths = {}
			if (typeof app != 'undefined') {
				app_paths = {
					userData:   app.getPath('userData'),
					appData:    app.getPath('appData'),
				}
			}

			response.end(JSON.stringify( Object.assign(app_paths,{
				dapps_path: dapps_path,	
				dirname:    __dirname,
				proc_env:   process.env
			}) ), 'utf-8')

			return true
		}

		if (request.url.indexOf('DApps/list')>-1) {
			response.end(JSON.stringify( this.list ), 'utf-8')
			return true
		}

		// remove game
		if (request.url.indexOf('DApps/remove')>-1) {
			let folder = request.url.split('/').slice(-1)[0]
			console.log('Remove folder', folder)
			this.remove( folder )
			response.end(JSON.stringify({removed:true}), 'utf-8')
			return true
		}

		// return DApp static content
		if (request.url.indexOf('DApps')>-1) {
			let filePath    = dapps_path + request.url.replace('/DApps/','')
			let contentType = filetypes[path.extname(filePath)] || false

			fs.readFile(filePath, function(error, content) {
				if (error) {
					response.writeHead(500)
					response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
					response.end()
				} else {
					if (contentType) {
						response.writeHead(200, { 'Content-Type': contentType })
					}
					response.end(content, 'utf-8')
				}
			})
			
			return true
		}
	}
}
DApps.init()



console.log('')
console.log('Start electron server with config', _config)
console.log('')




/*
 * HTTP static file server
 *  + Gun websocket
 *  + DApps serve
 */
const server = http.createServer(function (request, response) {
	if(Gun.serve(request, response)){
		return
	}

	response.setHeader('Access-Control-Allow-Origin', '*')

	if (DApps.serve(request, response)) {
		return
	}


	let filePath = __dirname + request.url
	if (filePath == __dirname+'/'){
		filePath = __dirname+'/index.html'
	}

	// Static serve
	let contentType = filetypes[path.extname(filePath)] || false

	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile(__dirname+'/index.html', function(error, content) {
					if (contentType) {
						response.writeHead(200, { 'Content-Type': contentType })
					}
					response.end(content, 'utf-8')
				})
			} else {
				response.writeHead(500)
				response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
				response.end()
			}
		} else {
			if (contentType) {
				response.writeHead(200, { 'Content-Type': contentType })
			}
			response.end(content, 'utf-8')
		}
	})

})

server.listen(_config.http_port)

global.GunDB  = Gun({file: _config.database, web: server })
global.fetch  = require('node-fetch')
global.window = {}


/*
 * Network change
 */
let start_net = {
	code:'ropsten'
}

GunDB.get('network').val( n => {
	if (!n || typeof n === 'undefined') { return }
	start_net = n
})


setTimeout(()=>{
	global.network = Object.assign({}, start_net)

	// Subscribe to change network
	GunDB.get('network').on( n =>{
		if (!n || typeof n === 'undefined') { return }

		if (network.code != n.code || (n.code=='custom' && (n.url!=network.url || n.erc20!=network.erc20)) ) {
			clearTimeout(global.restartT)
			global.restartT = setTimeout(()=>{
				if (typeof app!=='undefined') {
					app.quit()
					return
				}
				process.exit()
			}, 5000)
		}
	})

	// require('./app.background.js')

}, 1000)

