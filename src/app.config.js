/*
 * App settings
 */

let bankroller_server = 'http://localhost:9999'


let current_network = 'ropsten'

if (process.env.NODE_ENV !== 'server' && window && window.localStorage.current_network) {
	current_network = window.localStorage.current_network
}

// Contract with referral stat
let stat_contract = '0x94cfd3646f89166afe094940159742a3f6ba9a0c'


const games = {
	dice_v2:{ code: 'dice_v2',
		name: 'DiceGame',
		url:  'https://platform.dao.casino/games/DiceGame/',
		img:  'https://platform.dao.casino/img/img-game2.jpg',
	},
	blackjack:{ code: 'blackjack',
		name: 'blackjack',
		url:  'http://blackjackgame.dao.casino/games/bj/',
	}
}

const networks = {
	'ropsten': {
		enabled:       true,
		name:          'Ropsten Test Network',
		rpc_url:       'https://ropsten.infura.io/JCnK5ifEPH9qcQkX0Ahl',
		erc20_address: '0x95a48dca999c89e4e284930d9b9af973a7481287',
		etherscan_url: 'https://ropsten.etherscan.io'
	},
	'rinkeby': {
		enabled:       true,
		name:          'Rinkeby Test Network',
		rpc_url:       'https://rinkeby.infura.io/JCnK5ifEPH9qcQkX0Ahl',
		erc20_address: '0xba2f1399df21c75ce578630ff9ed9285b2146b8d',
		etherscan_url: 'https://rinkeby.etherscan.io'
	},
	// 'mytest': {
	// 	enabled: true,
	// 	name:    'My Ropsten node',
	// 	rpc_url: 'http://91.201.53.97',
	// 	etherscan_url: 'https://ropsten.etherscan.io'
	// },
	'mainnet': {
		enabled: false,
		name:    'Main Ethereum Network',
		rpc_url: 'https://infura.io/JCnK5ifEPH9qcQkX0Ahl',
		etherscan_url: 'https://etherscan.io'
	},
}


module.exports = {
	wallet_pass:     '1234',
	server:          bankroller_server,

	network:         current_network,
	networks:        networks,

	erc20_address:   networks[current_network].erc20_address,
	stat_contract:   stat_contract,
	rpc_url:         networks[current_network].rpc_url,
	etherscan_url:   networks[current_network].etherscan_url,

	games:           games,
	contracts:       require('./configs/games.contracts.js'),

	api_url:         'https://platform.dao.casino/api/',
	confirm_timeout: 7000,
}
