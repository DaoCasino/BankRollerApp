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

const rpc    = new RPC( _config.HttpProviders.infura.url )
const wallet = new Wallet()

class Eth {
	constructor(){
		this.ABI     = ABI
		this.RPC     = rpc
		this.Wallet  = wallet

		this.getCurBlock()
	}

	deployContract(contract_bytecode, callback){

		let checkContractDeployed = (transaction_hash, callback)=>{ setTimeout(()=>{
			console.log('checkContractDeployed', 'https://rinkeby.etherscan.io/tx/'+transaction_hash)

			this.RPC.request('getTransactionReceipt', [transaction_hash]).then( response => {

				console.log('checkContractDeployed result', response.result)

				if (!response || !response.result || !response.result.contractAddress) {
					checkContractDeployed(transaction_hash, callback)
					return
				}

				console.log('[OK] checkContractDeployed - address:', 'https://rinkeby.etherscan.io/address/'+response.result.contractAddress)

				callback(response.result.contractAddress)
			}).catch( err => {
				console.error('checkContractDeployed:', err)
				checkContractDeployed(transaction_hash, callback)
			})
		}, 9000)}

		this.Wallet.signTx({
			data:     contract_bytecode,
			gasLimit: 0x4630C0,
			gasPrice: '0x737be7600',
			value:    0
		}, signedTx => {
			this.RPC.request('sendRawTransaction', ['0x' + signedTx], 0).then( response => {
				if (!response.result) { return }
				checkContractDeployed(response.result, callback)
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
			'to':   _config.contracts.erc20.address,
			'data': data
		}, 'latest']
		).then( response => {
			callback( Utils.hexToNum(response.result) / 100000000 )
		}).catch( err => {
			console.error(err)
		})
	}


	getCurBlock(){
		if (this.cur_block_upd < new Date().getTime()) {
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
		this.curBlock      = block
		this.cur_block_upd = new Date().getTime() + 60
	}
}

export default new Eth()
export {rpc as RPC, wallet as Wallet, ABI as ABI}
