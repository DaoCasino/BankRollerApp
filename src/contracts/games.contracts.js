/* eslint-disable */


const factoryes = {
	BJ      : require('./channel.abi.js') ,
	MG      : require('./channel.abi.js') ,
	slot    : require('./channel.abi.js') ,
	dice_v2 : require('./game.dice.js')   ,
}

factoryes.BJ.factory.address = '0x16f3751278a07c96fd969a816504c51e0857856c'
// factoryes.slot.factory.address = ''
factoryes.MG.factory.address = '0xeb971dc255fd399b723745d61c63749fd0fab8e6'

module.exports = factoryes
