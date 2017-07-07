const _config = require('./config.electron.js')
const http    = require('http')
const path    = require('path')
const fs      = require('fs')

const Gun       = require('gun')
// const levelup   = require('levelup')
// const leveldown = require('leveldown')

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

let server = http.createServer(function (request, response) {
	if(Gun.serve(request, response)){
		return
	}

	let filePath = __dirname + request.url
	if (filePath == __dirname+'/'){
		filePath = __dirname+'/index.html'
	}

	let contentType = filetypes[path.extname(filePath)]

	fs.readFile(filePath, function(error, content) {
		if (error) {
			if(error.code == 'ENOENT'){
				fs.readFile(__dirname+'/index.html', function(error, content) {
					response.writeHead(200, { 'Content-Type': contentType })
					response.end(content, 'utf-8')
				})
			} else {
				response.writeHead(500)
				response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
				response.end()
			}
		} else {
			response.writeHead(200, { 'Content-Type': contentType })
			response.end(content, 'utf-8')
		}
	})

})

server.listen(_config.http_port)


global.GunDB  = Gun({file: './database.json', web: server })
// require('gun-level')
// global.GunDB  = Gun({file: false, level:levelup('data', { db: leveldown }), web: server })

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
