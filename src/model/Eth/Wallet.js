import _config    from 'app.config'
import ethWallet  from 'eth-lightwallet'
import DB         from 'DB/DB'
import * as Utils from 'utils'


import {sign as signHash} from 'web3/packages/web3-eth-accounts/node_modules/eth-lib/lib/account.js'

const WEB3 = require('web3/packages/web3')
const web3 = new WEB3( new WEB3.providers.HttpProvider(_config.rpc_url) )

import RPC from './RPC'
const rpc = new RPC( _config.rpc_url )

let _web3acc
let _wallet  = false
let _privkey = false 

export default class Wallet {
	constructor() {
		this.lib  = ethWallet
		this.web3 = web3
		this.private_key = false

		if ( process.env.NODE_ENV !== 'server' ) {
			DB.getItem('wallet', (err, wallet)=>{
				if (wallet) {
					_wallet = wallet
					this.initWeb3Wallet()
					return
				}

				this.create()
			})
		}

		DB.data.get('wallet').on(wallet => {
			if(wallet) _wallet = wallet
		})

		this.checkWallet()
	}

	checkWallet(){
		if (_wallet) return

		setTimeout(()=>{
			DB.data.get('wallet', ack => {
				if(!ack.put){
					this.checkWallet()
				} else {
					_wallet = ack.put
					this.initWeb3Wallet()
				}
			})
		},3000)
	}

	get(){
		if (_wallet && !_wallet.address) {
			_wallet.address = Utils.pad( _wallet.addr, 64 )
		}

		return _wallet
	}

	getKs(){
		if (this.keyStore) {
			return this.keyStore
		}
		if (!_wallet || !_wallet.keystorage) {
			return false
		}

		this.keyStore = ethWallet.keystore.deserialize( _wallet.keystorage  )
		return this.keyStore
	}

	exportPrivateKey(callback=false){
		return new Promise((resolve, reject) => {	
			this.getPwDerivedKey( PwDerivedKey => {
				let private_key = this.getKs().exportPrivateKey(_wallet.addr, PwDerivedKey)
				_privkey = private_key
				this.private_key = private_key
				if(callback) callback(private_key)
				resolve(private_key)
			})
		})
	}


	getPwDerivedKey(callback, limit=5){
		if (this.pwDerivedKey) {
			if(callback) callback(this.pwDerivedKey)
			return this.pwDerivedKey
		}

		return new Promise((resolve, reject) => {
			if (!this.getKs()) { reject(); return }

			this.getKs().keyFromPassword(_config.wallet_pass, (err, pwDerivedKey)=>{
				if (err && limit>0 ) { this.getPwDerivedKey(callback, (limit-1)); return }

				if (pwDerivedKey) {
					this.pwDerivedKey = pwDerivedKey
				}
				resolve(pwDerivedKey)
				if(callback) callback(pwDerivedKey)
			})
		})
	}


	reset(){
		DB.setItem('wallet', null)
	}

	create(callback){
		if (this.create_proccess) {
			return
		};

		this.create_proccess = true
		console.log('Create Wallet')

		let wallet = {}

		ethWallet.keystore.createVault({
			seedPhrase: ethWallet.keystore.generateRandomSeed(),
			password:   _config.wallet_pass
		}, (err, ks)=>{
			if (err) console.error('[Create Wallet] Error: ', err)

			ks.keyFromPassword(_config.wallet_pass, (err, pwDerivedKey)=>{
				if (err) console.error('[Create Wallet] keyFromPassword Error: ', err)

				ks.generateNewAddress(pwDerivedKey, 1)

				wallet.keystorage = ks.serialize()
				wallet.addr       = ks.getAddresses()[0]
				wallet.openkey    = '0x' + ks.getAddresses()[0]
				wallet.address    = Utils.pad( ks.getAddresses()[0], 64 )

				console.info('Wallet created!', wallet)

				DB.setItem('wallet', wallet)

				_wallet = wallet

				if (callback) { callback() }

				return
			})
		})
	}

	getAccountFromServer(){
		if (localStorage && localStorage.account_from_server) {
			if (localStorage.account_from_server=='wait') {
				return new Promise((resolve, reject) => {
					let waitTimer = ()=>{ setTimeout(()=>{
						if (localStorage.account_from_server.privateKey) {
							resolve(localStorage.account_from_server)
						} else {
							waitTimer()
						}
					}, 1000) }
					waitTimer()
				})
			}
			return
		}

		if (localStorage) localStorage.account_from_server = 'wait'
		return fetch('https://platform.dao.casino/faucet?get=account').then(res=>{
			return res.json()
		}).then(acc=>{
			console.log('Server account data:', acc)
			if (localStorage) localStorage.account_from_server = acc
			_wallet.openkey = acc.address
			return acc.privateKey
		}).catch(e=>{
			return false
		})
	}

	async getNonce(callback=false){
		if (this.nonce) {
			this.nonce++
			let hexstr = '0x'+Utils.numToHex(this.nonce)
			if(callback) callback(hexstr)
			return hexstr
		}

		const response = await rpc.request('getTransactionCount', [ this.get().openkey, 'latest'])
		this.nonce = Utils.hexToNum(response.result.substr(2))

		if(callback) callback(response.result)
		return response.result
	}

	// Make and Sing contract creation transaction
	async signedCreateContractTx(options, callback){
		options.nonce = await this.getNonce()

		let registerTx = ethWallet.txutils.createContractTx(
			_wallet.openkey.substr(2),
			options
						 ).tx

		this.signTx(registerTx, callback)
	}

	// Make and Sing eth send transaction
	async signedEthTx(to_address, value, callback){
		// https://github.com/ConsenSys/eth-lightwallet#txutilsvaluetxtxobject
		let options = {
			from:     this.get().openkey,
			to:       to_address,
			value:    value,
			nonce:    await this.getNonce(),
			gasPrice: '0x737be7600',
			gasLimit: '0x927c0',
		}

		// Make transaction
		let registerTx = ethWallet.txutils.valueTx(options)

		//  Sign transaction
		this.signTx(registerTx, callback)
	}

	//  Make and Sing contract function transaction
	async signedContractFuncTx(contract_address, contract_abi, function_name, function_args, callback, gasLimit=700000, gasPrice=81000000000){
		const nonce = await this.getNonce()
		console.log('signedContractFuncTx nonce', nonce)
		let options = {
			to:       contract_address,
			nonce:    nonce,
			gasPrice: '0x'+Utils.numToHex(gasPrice),
			gasLimit: '0x'+Utils.numToHex(gasLimit),
			value:    0,
		}

		//  Make contract function transaction
		// https://github.com/ConsenSys/eth-lightwallet#txutilsfunctiontxabi-functionname-args-txobject
		let registerTx = ethWallet.txutils.functionTx(
			contract_abi,
			function_name,
			function_args,
			options
		)
		console.log('registerTx', registerTx)
		//  Sign transaction
		return this.signTx(registerTx, callback)
	}

	// Sing transaction
	// https://github.com/ConsenSys/eth-lightwallet#signingsigntxkeystore-pwderivedkey-rawtx-signingaddress-hdpathstring
	signTx(registerTx, callback=false){
		this.getPwDerivedKey( PwDerivedKey => {

			let signedTx = ethWallet.signing.signTx(
				this.getKs(),
				PwDerivedKey,
				registerTx,
				this.get().openkey.substr(2)
			)
			if(callback) callback(signedTx)
			return signedTx
		})
	}

	initWeb3Wallet(){
		if (typeof this.signTransaction === 'function') return
		this.exportPrivateKey( privkey => {
			_web3acc = this.web3.eth.accounts.privateKeyToAccount( '0x'+privkey )
			this.web3.eth.accounts.wallet.add( '0x'+privkey )
			this.signTransaction = _web3acc.signTransaction
		})
	}

	sign(raw){
		console.info('call %web3.eth.accounts.sign', ['font-weight:bold;'])
		console.log('More docs: http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#sign')
		
		raw = Utils.remove0x(raw)
		return _web3acc.sign(raw)
	}
}



