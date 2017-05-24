/*
 * App settings
 * for dev and production builds
 */

// const mode = 'dev'
const mode = 'production'

// const current_network = 'rinkeby'
let current_network = 'ropsten'
if (window && window.localStorage.current_network) {
	current_network = window.localStorage.current_network
}

const networks = {
	'ropsten': {
		enabled: true,
		name:    'Ropsten Test Network',
	},
	'rinkeby': {
		enabled: true,
		name:    'Rinkeby Test Network',
	},
	'mainnet': {
		enabled: false,
		name:    'Main Ethereum Network',
	},
}

const games = {
	dice:{
		name:'dice',
		url:'http://dev.dao.casino/games/dice/',
	},
	blackjack:{
		name:'blackjack',
		url:'http://blackjackgame.dao.casino/games/bj/',
	}
}


const configs = {
	'mainnet': {
		api_url: 'https://platform.dao.casino/api/',

		wallet_pass:'1234',

		HttpProviders:{
			infura:{
				active:true,
				url:'https://infura.io/JCnK5ifEPH9qcQkX0Ahl',
			}
		},

		confirm_timeout:7000,

		contracts:{}
	},

	'rinkeby': {
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

let conf = configs[current_network]
conf.contracts = require('./configs/'+current_network+'.contracts.js')
conf.mode      = mode
conf.network   = current_network
conf.networks  = networks
conf.games     = games

conf.etherscan_url = 'https://etherscan.io'
if (current_network!='mainnet') {
	conf.etherscan_url = `https://${current_network}.etherscan.io`
};

module.exports = conf

