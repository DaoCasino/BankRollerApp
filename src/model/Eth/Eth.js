/*
 * Wrapper for all Ethereum methods
 * RPC, ligthWallet, and custom functions
 *
 **/

import _config from 'app.config'
import RPC     from './RPC'
import Wallet  from './Wallet'
import ABI     from 'ethereumjs-abi'

import * as Utils from 'utils'

const web3_sha3 = require('web3/lib/utils/sha3.js')

const rpc    = new RPC( _config.rpc_url )
const wallet = new Wallet()

class Eth {
	constructor(){
		this.ABI     = ABI
		this.RPC     = rpc
		this.Wallet  = wallet

		// setTimeout(()=>{
		// 	console.clear()
		// 	this.getTransactionsByAccount('0x8ac300f0dd296145380424a9118ac59d32c8c6a5')
		// },3000)

		this.getCurBlock()
	}

	deployContract(contract_bytecode, gasprice=151000000000, callback_deployed, callback_proccess){

		let checkContractDeployed = (transaction_hash, callback)=>{ setTimeout(()=>{
			console.log('checkContractDeployed', _config.etherscan_url+'/tx/'+transaction_hash)

			this.RPC.request('getTransactionReceipt', [transaction_hash]).then( response => {

				console.log('checkContractDeployed result', response.result)

				if (!response || !response.result || !response.result.contractAddress) {
					checkContractDeployed(transaction_hash, callback)
					return
				}

				console.log('[OK] checkContractDeployed - address:', _config.etherscan_url+'/address/'+response.result.contractAddress)

				callback(response.result.contractAddress)
			}).catch( err => {
				console.error('checkContractDeployed:', err)
				checkContractDeployed(transaction_hash, callback)
			})
		}, 9000)}

		this.Wallet.signContractTx({
			data:     contract_bytecode,
			gasLimit: '0x4630C0',
			gasPrice: '0x' + Utils.numToHex(gasprice),
			value:    0
		}, signedTx => {
			this.RPC.request('sendRawTransaction', ['0x' + signedTx], 0).then( response => {
				if (!response.result) {
					console.log(response.message)
					if (!response.message || response.message.indexOf('known transaction')==-1) {
						return
					}
				}
				checkContractDeployed(response.result, callback_deployed)
				callback_proccess()
			})
		})
	}

	// Get contract function hash name
	// https://github.com/ethereum/homestead-guide/blob/master/source/contracts-and-transactions/accessing-contracts-and-transactions.rst#interacting-with-smart-contracts
	// function hashname is first 4 bytes of sha3 of string with function name with params types
	//  web3.sha3('balanceOf(address)').substring(0, 8)
	hashName(name){
		return web3_sha3(name).substr(0,8)
	}

	getEthBalance(address, callback){
		this.RPC.request('getBalance', [address, 'latest']).then( response => {
			callback( Utils.hexToNum(response.result) / 1000000000000000000 )
		}).catch( err => {
			console.error(err)
		})
	}

	getBetsBalance(address, callback){
		let data = '0x' + this.hashName('balanceOf(address)')
				  		+ Utils.pad(Utils.numToHex(address.substr(2)), 64)


		this.RPC.request('call', [{
			'from': this.Wallet.get().openkey,
			'to':   _config.erc20_address,
			'data': data
		}, 'latest']
		).then( response => {
			callback( Utils.hexToNum(response.result) / 100000000 )
		}).catch( err => {
			console.error(err)
		})
	}

	sendBets(to, amount, callback){
		this.Wallet.signRawTransaction(
			_config.erc20_address, _config.erc20_abi,

			'transfer', [to, (amount*100000000)],

			signedTx => {

				this.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
					if (!response || response.result) { return }
					callback( response.result )
				})
			}
		)
	}

	// getTransactionsByAccount(myaccount, startBlockNumber, endBlockNumber) {
	// 	if (!endBlockNumber) {
	// 		endBlockNumber = this.getCurBlock()
	// 	}
	// 	if (!startBlockNumber) {
	// 		startBlockNumber = endBlockNumber - 1000
	// 	}

	// 	for (let i = startBlockNumber; i <= endBlockNumber; i++) {
	// 		if (i % 1000 == 0) {
	// 			console.log('Searching block ' + i)
	// 		}
	// 		let block = this.getBlock(i, true)

	// 		if (block != null && block.transactions != null) {
	// 			block.transactions.forEach( function(e) {
	// 				if (myaccount == '*' || myaccount == e.from || myaccount == e.to) {
	// 					console.log('  tx hash          : ' + e.hash + '\n'
	// 						+ '   nonce           : ' + e.nonce + '\n'
	// 						+ '   blockHash       : ' + e.blockHash + '\n'
	// 						+ '   blockNumber     : ' + e.blockNumber + '\n'
	// 						+ '   transactionIndex: ' + e.transactionIndex + '\n'
	// 						+ '   from            : ' + e.from + '\n'
	// 						+ '   to              : ' + e.to + '\n'
	// 						+ '   value           : ' + e.value + '\n'
	// 						+ '   time            : ' + block.timestamp + ' ' + new Date(block.timestamp * 1000).toGMTString() + '\n'
	// 						+ '   gasPrice        : ' + e.gasPrice + '\n'
	// 						+ '   gas             : ' + e.gas + '\n'
	// 						+ '   input           : ' + e.input)
	// 				}
	// 			})
	// 		}
	// 	}
	// }


	getBlock(num, callback){
		this.RPC.request('getBlockByNumber', [ '0x'+Utils.numToHex(num), true]).then( response => {
			if (!response || !response.result) { return }
			callback(response.result)
		}).catch( err => {
			console.error('getBlockByNumber error:', err)
		})

	}
	getCurBlock(){
		if (!this.cur_block_upd || this.cur_block_upd < new Date().getTime()) {
			this.RPC.request('blockNumber').then( response => {
				if (!response || !response.result) { return }
				this.setCurBlock(response.result)

			}).catch( err => {
				console.error('getCurBlock error:', err)
			})
		}

		return this.cur_block
	}

	setCurBlock(block){
		this.cur_block      = block
		this.cur_block_upd = new Date().getTime() + 60
	}
}

export default new Eth()
export {rpc as RPC, wallet as Wallet, ABI as ABI}
