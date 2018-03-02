/*
 * Wrapper for RSA
 *
 **/
import cryptico   from 'js-cryptico'
import _config    from '../app.config'

const parseBigInt = (a, b) => {
	return new cryptico.RSAKey().parseInt(a, b)
}

export default class RSA {
	constructor (publickExponent = '10001') {
		this.RSA = new cryptico.RSAKey()
		this.publicExponent = publickExponent
	}

	// Method for creation private RSA keys for sign (for Bankroller)
	generateRSAkey (long = 2048) {
		this.RSA.generate(long, this.publicExponent)
	}

	// Sign rawMsg
	signHash (message) {
		let msg = parseBigInt(message, 16)
		msg = msg.mod(this.RSA.n)
		return this.RSA.doPrivate(msg)
	}
}
