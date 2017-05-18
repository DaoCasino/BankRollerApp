let need_res = '0x70a08231'

console.log(' >> Start: web3_sha3')
const web3_sha3 = require('web3/lib/utils/sha3.js')

let web3_sha3_res = '0x'+web3_sha3('balanceOf(address)').substr(0,8)

console.log( web3_sha3_res +'=='+ need_res )
if (web3_sha3_res===need_res) {
	console.log(' web3_sha3 - SUCCESS!')
} else {
	console.log(' web3_sha3 - ERROR!')
}
