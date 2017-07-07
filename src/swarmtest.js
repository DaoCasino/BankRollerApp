
const games = {
	'dice_v2':{
		code:    'dice_v2',
		archive: 'https://nodeload.github.com/DaoCasino/DiceGame/zip/master',
		root:    'DiceGame-master',
	},
}

const gateways = ['http://swarm-gateways.net']
console.log(gateways[0])
const FS       = require('fs')
const unzip    = require('unzip')
const Download = require('download-file')
const Swarm    = require('swarm-js').at(gateways[0])


const deployGame = function(game){
	let tmpdir  = './tmp/'+game.code+'/'
	let zipfile = game.code+'.zip'
	let root    = tmpdir+game.root

	Download(game.archive, {
		directory: tmpdir,
		filename:  zipfile
	}, function(err){
		if (err) throw err

		FS.createReadStream(tmpdir+zipfile).pipe(unzip.Extract({ path: tmpdir })).on('close', res => {
			Swarm.upload({
				path:        root,
				kind:        'directory',
				defaultFile: '/index.html'
			}).then(hash => {
				const game_url = gateways[0]+'/bzz:/' + hash

				console.log('game url:' + game_url)
			}).catch(console.log)

		})
	})

}



// const indexHtml =
// `<html>
//   <body>
//     <h3>Dao Casino SWARM TEST</h3>
//     <p><a href="http://dao.casino">link to site</a></p>
//   </body>
// </html>`


// const exampleDApp = {
// 	''                     : {type: 'text/html', data: indexHtml},
// 	'/index.html'          : {type: 'text/html', data: indexHtml},
// }

// Swarm.upload(exampleDApp)
//   .then(console.log)
//   .catch(console.log)



// deployGame(games['dice_v2'])
let path = __dirname.split('/').slice(0, __dirname.split('/').length-1).join('/')

Swarm.upload({
	path:        path+'/tmp/dice_v2/DiceGame-master/',
	kind:        'directory',
	defaultFile: '/index.html'
}).then(hash => {
	const game_url = gateways[0]+'/bzz:/' + hash

	console.log('game url:' + game_url)
}).catch(console.log)
