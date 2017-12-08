/*
 	    ___                           __    _______                      __
 	  / _ \___ ___ ____ _  ___ ___  / /_  / ___/ /  ___ ____  ___  ___ / /
 	 / ___/ _ `/ // /  ' \/ -_) _ \/ __/ / /__/ _ \/ _ `/ _ \/ _ \/ -_) / 
 	/_/   \_,_/\_, /_/_/_/\__/_//_/\__/  \___/_//_/\_,_/_//_/_//_/\__/_/  
 	          /___/                                                       
 	    
     Dao.Casino PaymentChannleContract
     0x029c61e3e9958b06bb63cc5c213c47cd114ab971
     https://ropsten.etherscan.io/address/0x029c61e3e9958b06bb63cc5c213c47cd114ab971#code
     version 1.0
     more about payment channels: 
     https://en.bitcoin.it/wiki/Payment_channels
 */

module.exports = {
	address : '0x029c61e3e9958b06bb63cc5c213c47cd114ab971',
	abi     : JSON.parse('[{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"closeByConsent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"channels","outputs":[{"name":"player","type":"address"},{"name":"bankroller","type":"address"},{"name":"playerBalance","type":"uint256"},{"name":"bankrollBalance","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"endBlock","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"h","type":"bytes32"},{"name":"signature","type":"bytes"}],"name":"recoverSigner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"player","type":"address"},{"name":"bankrollerAddress","type":"address"},{"name":"playerDeposit","type":"uint256"},{"name":"bankrollDeposit","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"time","type":"uint256"},{"name":"sig","type":"bytes"}],"name":"open","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"}],"name":"closeByTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"signature","type":"bytes"}],"name":"signatureSplit","outputs":[{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"},{"name":"v","type":"uint8"}],"payable":false,"stateMutability":"pure","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"action","type":"string"},{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"playerBalance","type":"uint256"},{"indexed":false,"name":"bankrollBalance","type":"uint256"},{"indexed":false,"name":"nonce","type":"uint256"}],"name":"logChannel","type":"event"}]')
}