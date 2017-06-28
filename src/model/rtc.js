import * as Utils from './utils'

let MeshMsgs    = {}
let _subscribes = {}

export default class RTC {
	constructor(user_id=false, room='daocasino-games') {

		this.user_id = user_id || Utils.makeSeed()

		const qc =  require('rtc-quickconnect')('http://46.101.244.101:8997/',{
			room:       room,
			iceServers: require('freeice')()
		})

		const mesh = require('rtc-mesh')

		MeshMsgs = mesh(qc)

		MeshMsgs.on('change', function(key, data) {
			if (data.address && _subscribes[data.address]) {
				for(let k in _subscribes[data.address]){
					_subscribes[data.address][k](data)
				}
			}
		})
	}

	subscribe(address, callback){
		if (!_subscribes[address]) { _subscribes[address] = [] }

		for(let k in _subscribes[address]){
			if (_subscribes[address][k].toString() == callback.toString()) {
				return
			}
		}

		_subscribes[address].push(callback)
	}


	sendMsg(data){
		MeshMsgs.set(this.user_id, data)
	}
}
