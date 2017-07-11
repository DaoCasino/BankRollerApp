import * as Utils from './utils'

import DB         from './DB/DB'

const signalserver = 'https://ws.dao.casino/mesh/'

let _subscribes = {}

let DB_msgs = DB.data.get('RTC_msgs')
let   _msgs = []

export default class RTC {
	constructor(user_id=false, room='daocasino-games6') {
		this.user_id = user_id || Utils.makeSeed()

		this.channel = false
		this.connect(room)

		DB_msgs.map().val((time,seed)=>{
			_msgs.push(seed)
			if ( Math.abs(time - new Date().getTime()) > 5*60*1000 ) {
				setTimeout(()=>{ DB_msgs.get(seed).put(null) }, 100)
			}
		})
	}

	connect(room){
		const mesh = require('rtc-mesh')
		const qc   = require('rtc-quickconnect')

		this.channel = mesh( qc(signalserver, {
			// debug:      true,
			room:       room,
			iceServers: require('freeice')()
		}))

		this.channel.on('change', (key, value) => {
			let data = JSON.parse(value)

			if (!data.seed || _msgs.indexOf(data.seed) > -1) {
				return
			};


			_msgs.push(data.seed)
			DB_msgs.get(data.seed).put( new Date().getTime() )

			if (data.user_id && data.user_id==this.user_id) {
				return
			}

			if (data.address && (_subscribes[data.address])) {
				for(let k in _subscribes[data.address]){
					_subscribes[data.address][k](data)
				}
			}

			if (_subscribes['all']) {
				for(let k in _subscribes['all']){
					_subscribes['all'][k](data)
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
		if (!this.channel) {
			setTimeout(()=>{ this.sendMsg(data) },1000)
			return
		}
		data.user_id = this.user_id

		this.channel.set(this.user_id, JSON.stringify(data))
	}
}
