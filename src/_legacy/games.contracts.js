/* eslint-disable */

let channel_abi = require('./channel.abi.js')
let factoryes = {
	BJ_m    : JSON.parse(JSON.stringify(channel_abi)) ,
}

factoryes.BJ_m.factory.address    = '0xea8b7af5c14cec5efdd3f7e65b09f8aaa212367e'

module.exports = factoryes
