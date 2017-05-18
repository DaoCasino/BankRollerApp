/*
 * App settings
 * for dev and production builds
 */

const mode = 'dev'
// const mode = 'production'

const current_network = 'rinkeby'

const config = {
	'rinkeby': {
		network: 'rinkeby',
		api_url: 'https://platform.dao.casino/api/',

		wallet_pass:'1234',

		HttpProviders:{
			infura:{
				active:true,
				url:'https://rinkeby.infura.io/JCnK5ifEPH9qcQkX0Ahl',
			}
		},

		confirm_timeout:7000,

		contracts:{}
	},

	'ropsten': {
		network: 'ropsten',
		api_url: 'https://platform.dao.casino/api/',

		wallet_pass:'1234',


		HttpProviders:{
			infura:{
				active:true,
				url:'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
			}
		},

		confirm_timeout:7000,

		contracts:{}
	}
}


config[current_network].contracts = require('./configs/'+current_network+'.contracts.js')
config[current_network].mode = mode


config[current_network].games = {
	dice:{
		name:'dice',
		url:'http://dev.dao.casino/games/dice/',
	}
}

module.exports = config[current_network]
