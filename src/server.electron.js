const _config = require('./config.electron.js')
const http    = require('http')
const path    = require('path')
const queryp  = require('querystring')
const fs      = require('fs')
const fse     = require('fs-extra')

const {app} = require('electron')

const Gun     = require('gun')

console.log('')
console.log('Start electron server with config', _config)
console.log('')

/*
 * HTTP static file server
 *  + Gun websocket
 */
const filetypes = {
	'.js':   'text/javascript',
	'.css':  'text/css',
	'.json': 'application/json',
	'.svg':  'image/svg+xml',
	'.png':  'image/png',
	'.jpg':  'image/jpg',
	'.wav':  'audio/wav',
}

const server = http.createServer(function (request, response) {
	if(Gun.serve(request, response)){
		return
	}

	response.setHeader('Access-Control-Allow-Origin', '*')


	if (request.method == 'POST' && request.url.indexOf('/upload_game/')>-1) {
		console.log( 'upload_game' )

		let body = ''
		request.on('data', function (data) {
			body += data

			// Too much POST data, kill the connection!
			// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
			if (body.length > 1e6) request.connection.destroy()
		})

		request.on('end', ()=>{
			uploadGame( queryp.parse(body) )
			response.end('{"result":"ok"}', 'utf-8')
		})
	}


	let filePath = __dirname + request.url
	if (filePath == __dirname+'/'){
		filePath = __dirname+'/index.html'
	}

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

	require('./app.background.js')

}, 1000)



let dapps_path = (app.getAppPath() + _config.dapps_path).split('//').join('/')

const readManifest = function(path){
	try	{
		return JSON.parse(fs.readFileSync(path))		
	} catch(e){
		return false
	}
}

const uploadGame = function(data){
	let manifest
	for(let k in data){
		try {
			manifest = JSON.parse(k).manifest
			break
		} catch(e) {
			console.log(e)
		}
	}

	const dapp_config = readManifest(manifest.path)
	if (!dapp_config) {
		return
	}
	fse.copySync( 
		manifest.path.split('/').slice(0,-1).join('/'), 
		dapps_path + dapp_config.name 
	)
}


// Run games
const runGames = function(){	
	let dappsDirs = false
	try {
		dappsDirs = fse.readdirSync(dapps_path)
	} catch(e) {
		return
	}
	
	console.log(dappsDirs)

	dappsDirs.forEach(dir=>{
		const full_path   = dapps_path+dir+'/'
		const dapp_config = readManifest( full_path+'dapp.manifest' )
		if (!dapp_config) {
			return
		}

		console.log('dapp_config', dapp_config)
		
		const module_path = full_path + dapp_config.run.server

		console.log('module_path', module_path)

		require(module_path)
	})
}

runGames()







