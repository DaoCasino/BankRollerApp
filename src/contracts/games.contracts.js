/* eslint-disable */

let channel_abi = require('./channel.abi.js')
let factoryes = {
	BJ      : JSON.parse(JSON.stringify(channel_abi)) ,
	// MG      : JSON.parse(JSON.stringify(channel_abi)) ,
	slot    : JSON.parse(JSON.stringify(channel_abi)) ,
	dice_v2 : require('./game.dice.js')     ,
}

factoryes.BJ.factory.address = '0x16f3751278a07c96fd969a816504c51e0857856c'
// factoryes.BJ.factory.address = '0x53dcce0025b79448ece4a9360f29f48fadf7115c'
// factoryes.MG.factory.address = '0xeb971dc255fd399b723745d61c63749fd0fab8e6'
// factoryes.slot.factory.address = ''

module.exports = factoryes
