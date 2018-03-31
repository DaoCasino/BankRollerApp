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

const web3_sha3 = require('web3/packages/web3-utils').sha3

const rpc    = new RPC( _config.rpc_url )
const wallet = new Wallet()

let balances_cache = {}

class Eth {
	constructor(){
		this.ABI     = ABI
		this.RPC     = rpc
		this.Wallet  = wallet

		this.getCurBlock()
	}

	deployChannelContract(factory, callback_deployed, callback_proccess){
		// Create contract function transaction
		this.Wallet.signedContractFuncTx(
			factory.address, factory.abi,
			'createGameChannel', [],

			// result: signed transaction
			async signedTx => {
				// send transacriont to RPC
				const response = await this.RPC.request('sendRawTransaction', ['0x'+signedTx], 0)

				if (!response.result) {
					console.log(response.message)
					if (!response.message || response.message.indexOf('known transaction')==-1) {
						return
					}
				}
				this.checkContractDeployed(response.result, callback_deployed)
				callback_proccess()
			},

			// gas limit
			3000000
		)
	}

	deployGameContract(factory, callback_deployed, callback_proccess){
		// Create contract function transaction
		this.Wallet.signedContractFuncTx(
			factory.address, factory.abi,
			'createDiceRoll', [],

			// result: signed transaction
			async signedTx => {
				// send transacriont to RPC
				const response = await this.RPC.request('sendRawTransaction', ['0x'+signedTx], 0)

				if (!response.result) {
					console.log(response.message)
					if (!response.message || response.message.indexOf('known transaction')==-1) {
						return
					}
				}
				this.checkContractDeployed(response.result, callback_deployed)
				callback_proccess()
			},
			(5*600000) )
	}

	deployContract(contract_bytecode, gasprice=400000000000, callback_deployed, callback_proccess){
		this.Wallet.signedCreateContractTx({
			data:     contract_bytecode,
			gasLimit: '0x4630C0',
			gasPrice: '0x'+Utils.numToHex(400000000000),
			gasPrice: '0x' + Utils.numToHex(gasprice),
			value:    0
		}, async signedTx => {
			const response = await this.RPC.request('sendRawTransaction', ['0x' + signedTx], 0)

			if (!response.result) {
				console.log(response.message)
				if (!response.message || response.message.indexOf('known transaction')==-1) {
					return
				}
			}
			this.checkContractDeployed(response.result, callback_deployed)
			callback_proccess()
		})
	}

	checkContractDeployed(transaction_hash, callback){ setTimeout(async ()=>{
		console.log('checkContractDeployed', _config.etherscan_url+'/tx/'+transaction_hash)

		const response = await this.RPC.request('getTransactionReceipt', [transaction_hash])

		if (!response || !response.result || !response.result.logs || !response.result.logs[0] || !response.result.logs[0].data) {
			this.checkContractDeployed(transaction_hash, callback)
			return
		}

		var contractAddress = '0x'+response.result.logs[0].data.substr(-40)

		console.log('[OK] checkContractDeployed - address:', _config.etherscan_url+'/address/'+contractAddress)

		callback(contractAddress)

	}, 9000)}


	// Get contract function hash name
	// https://github.com/ethereum/homestead-guide/blob/master/source/contracts-and-transactions/accessing-contracts-and-transactions.rst#interacting-with-smart-contracts
	// function hashname is first 4 bytes of sha3 of string with function name with params types
	//  web3.sha3('balanceOf(address)').substring(0, 8)
	hashName(name){
		return web3_sha3(name).substr(2,8)
	}

	getEthBalance(address, callback, force=false){
		if (!force && balances_cache[address] && balances_cache[address].eth_t > (new Date().getTime()-60*1000) ) {
			callback( balances_cache[address].eth )
			return
		}

		this.RPC.request('getBalance', [address, 'latest']).then( response => {
			if (!balances_cache[address]) {
				balances_cache[address] = {}
			}

			balances_cache[address].eth_t = new Date().getTime()
			balances_cache[address].eth   = Utils.hexToNum(response.result) / 1000000000000000000

			callback( balances_cache[address].eth )
		}).catch( err => {
			console.error(err)
		})
	}

	getBetsBalance(address, callback=()=>{}, force=false){
		if (!force && balances_cache[address] && balances_cache[address].bets_t > (new Date().getTime()-60*10000) ) {
			callback( balances_cache[address].bets )
			return
		}

		let data = '0x' + this.hashName('balanceOf(address)')
				  		+ Utils.pad(Utils.numToHex(address.substr(2)), 64)

		return new Promise((resolve, reject) => {
			this.RPC.request('call', [{
				'from': this.Wallet.get().openkey,
				'to':   _config.erc20_address,
				'data': data
			}, 'latest']
			).then( response => {
				if (!balances_cache[address]) {
					balances_cache[address] = {}
				}
				balances_cache[address].bets_t = new Date().getTime()
				balances_cache[address].bets   = Utils.hexToNum(response.result) / 100000000
				resolve(balances_cache[address].bets)
				callback( balances_cache[address].bets )
			}).catch( err => {
				reject(err)
				console.error(err)
			})
		})
	}

	sendBets(to, amount, callback){
		// Create contract function transaction
		this.Wallet.signedContractFuncTx(
			// contract with bets
			_config.erc20_address, _config.erc20_abi,

			// contract function and params
			'transfer', [to, (amount*100000000)],

			// result: signed transaction
			signedTx => {

				// send transacriont to RPC
				this.RPC.request('sendRawTransaction', ['0x'+signedTx], 0).then( response => {
					if (!response || !response.result) { return }
					callback( response.result )
				})
			}
		)
	}

	sendEth(to, amount, callback){
		amount = amount * 1000000000000000000

		this.Wallet.signedEthTx(to, amount, async (signedEthTx)=>{
			console.log(signedEthTx)
			const response = await this.RPC.request('sendRawTransaction', ['0x'+signedEthTx], 0)
			if (!response || !response.result) { return }
			callback( response.result )
		})
	}

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
