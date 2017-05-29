const _config = require('./config.electron.js')
const http    = require('http')
const path    = require('path')
const fs      = require('fs')
const Gun     = require('gun')


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


/*
 * Database server
 */
let DB = Gun({
	file: 'database.json',
	web:  server,
})

// DB.get('mark', function(ack){
	// console.log(ack)
// })
// setInterval(()=>{
// 	let t = new Date().getTime()
// 	console.log('put')
// 	DB.get('Test').put({name:'test', time:t}, (e)=>{
// 		console.log(e)
// 	})
// },2000)
