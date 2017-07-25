import _config    from 'app.config'
import ethWallet  from 'eth-lightwallet'
import DB         from 'DB/DB'
import * as Utils from 'utils'

import RPC from './RPC'
const rpc = new RPC( _config.rpc_url )

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
	async signedContractFuncTx(contract_address, contract_abi, function_name, function_args, callback, gasLimit=600000){
		let options = {
			to:       contract_address,
			nonce:    await this.getNonce(),
			gasPrice: '0x'+Utils.numToHex(40000000000),
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
		this.signTx(registerTx, callback)
	}

	// Sing transaction
	// https://github.com/ConsenSys/eth-lightwallet#signingsigntxkeystore-pwderivedkey-rawtx-signingaddress-hdpathstring
	signTx(registerTx, callback){
		this.getPwDerivedKey( PwDerivedKey => {

			let signedTx = ethWallet.signing.signTx(
				this.getKs(),
				PwDerivedKey,
				registerTx,
				this.get().openkey.substr(2)
			)

			callback(signedTx)
		})
	}
}



