import _config    from 'app.config'
import DB         from 'DB/DB'
import * as Utils from 'utils'

import RPC from './RPC'
const rpc = new RPC( _config.rpc_url )

let ethWallet = false

// in browser connected as external lib
if ( process.env.NODE_ENV !== 'server' ) {
	ethWallet = window.lightwallet
}

// for server
if (process.env.NODE_ENV === 'server') {
	ethWallet = require('eth-lightwallet')
}

let _wallet = false

export default class Wallet {
	constructor() {
		this.lib = ethWallet

		if ( process.env.NODE_ENV !== 'server' ) {
			DB.getItem('wallet', (err, wallet)=>{
				if (wallet) {
					_wallet = wallet
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

	exportPrivateKey(callback){
		this.getPwDerivedKey( PwDerivedKey => {
			let private_key = this.getKs().exportPrivateKey(_wallet.addr, PwDerivedKey)

			callback(private_key)
		})
	}


	getPwDerivedKey(callback, limit=5){
		if (this.pwDerivedKey) {
			callback(this.pwDerivedKey)
			return
		}

		if (!this.getKs()) { return }

		this.getKs().keyFromPassword(_config.wallet_pass, (err, pwDerivedKey)=>{
			if (err && limit>0 ) { this.getPwDerivedKey(callback, (limit-1)); return }

			if (pwDerivedKey) {
				this.pwDerivedKey = pwDerivedKey
			}
			callback(pwDerivedKey)
		})
	}


	reset(){
		DB.setItem('wallet', null)
	}

	create(callback){
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

	getNonce(callback){
		if (this.nonce) {
			this.nonce++
			callback('0x'+Utils.numToHex(this.nonce))
			return
		}

		rpc.request('getTransactionCount', [ this.get().openkey, 'pending']).then( response => {
			this.nonce = Utils.hexToNum(response.result.substr(2))

			console.log('nonce:', response.result)
			callback( response.result )
		})
	}


	signContractTx(options, callback){
		this.getPwDerivedKey( PwDerivedKey => {
			this.getNonce( nonce => {
				options.nonce = nonce

				let signedTx = ethWallet.signing.signTx(
					this.getKs(),
					PwDerivedKey,
					ethWallet.txutils.createContractTx(_wallet.openkey.substr(2), options).tx,
					_wallet.openkey.substr(2)
				)

				callback(signedTx)
			})
		})
	}

	signRawTransaction(to_address, contract_abi, function_name, function_args, callback){
		this.getPwDerivedKey( PwDerivedKey => { this.getNonce( nonce => {

			let options = {
				to:       to_address,
				nonce:    nonce,
				gasPrice: '0x737be7600',
				gasLimit: '0x927c0',
				value:    0,
			}

			let registerTx = ethWallet.txutils.functionTx(
								_config.erc20_abi,
								function_name,
								function_args,
								options
							)

			let signedTx = ethWallet.signing.signTx(
								this.getKs(),
								PwDerivedKey,
								registerTx,
								this.get().openkey.substr(2)
							)

			callback(signedTx)

		}) })
	}
}



