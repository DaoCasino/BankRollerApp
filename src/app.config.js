/*
 * App settings
 */

let bankroller_server = 'http://localhost:9999'

// Contract with referral stat
let stat_contract = '0xe195eed0e77b48146aa246dadf987d2504ac88cb'

const networks = {
	'custom': {
		enabled:       true,
		name:          'Custom RPC',
		rpc_url:       'http://localhost:8545',
		erc20_address: '0x95a48dca999c89e4e284930d9b9af973a7481287',
		etherscan_url: '#custom_rpc',
	},
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

	// 'mainnet': {
	// 	enabled: false,
	// 	name:    'Main Ethereum Network',
	// 	rpc_url: 'https://infura.io/JCnK5ifEPH9qcQkX0Ahl',
	// 	etherscan_url: 'https://etherscan.io'
	// },
}


//
// Get currect network settings
//
let current_network = 'ropsten'
if (process.env.NODE_ENV !== 'server' && window && window.localStorage.current_network) {
	current_network = window.localStorage.current_network

	if (current_network=='custom') {
		networks.custom.rpc_url       = window.localStorage.custom_network_url
		networks.custom.erc20_address = window.localStorage.custom_network_erc20
	}
}

if (process.env.NODE_ENV === 'server' && global.network ) {
	networks.custom.rpc_url       = global.network.url
	networks.custom.erc20_address = global.network.erc20
}




const legacy_games = {
	BJ_m: { code: 'BJ_m',
		channels: true,
		name:     'Blackjack Multiplayer',
		url:      'http://blackjackgame.dao.casino/games/bj/',
	}
}

module.exports = {
	db_name:        'DaoCasino',
	rtc_room:       'daocasino-room1',

	wallet_pass:     '1234',
	server:          bankroller_server,

	network:         current_network,
	networks:        networks,

	erc20_address:   networks[current_network].erc20_address,
	erc20_abi:       require('./contracts/erc20.abi.js'),

	stat_contract:   stat_contract,

	rpc_url:         networks[current_network].rpc_url,
	etherscan_url:   networks[current_network].etherscan_url,

	games:           legacy_games,
	contracts:       require('./contracts/games.contracts.js'),
	channels:        require('./contracts/channel.abi.js'),

	rtc_signalserver: 'https://ws.dao.casino/mesh/',
	api_url:          'https://platform.dao.casino/api/',
	confirm_timeout:  7000,
}

