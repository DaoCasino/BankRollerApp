import * as Utils from './utils'

import DB         from './DB/DB'

const signalserver = 'https://ws.dao.casino/mesh/'

const delivery_timeout = 3000

let _subscribes = {}

let DB_msgs = DB.data.get('RTC_msgs')
let   _msgs = []

export default class RTC {
	constructor(user_id=false, room='daocasino-room1') {
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
			if (!key || !value) { return }

			let data = {}

			try {
				data = JSON.parse(value)
			} catch(e) {
				return
			}

			if (data.user_id && data.user_id==this.user_id) {
				return
			}

			this.acknowledgeReceipt(data)


			if (!data.seed || _msgs.indexOf(data.seed) > -1) {
				return
			}

			if (data.action != 'delivery_confirmation') {
				_msgs.push(data.seed)
				DB_msgs.get(data.seed).put( new Date().getTime() )
			}

			// Call subscries
			if (data.address && _subscribes[data.address]) {
				for(let k in _subscribes[data.address]){
					if (typeof _subscribes[data.address][k] === 'function') {
						_subscribes[data.address][k](data)
					}
				}
			}

			if (_subscribes['all']) {
				for(let k in _subscribes['all']){
					if (typeof _subscribes['all'][k] === 'function') {
						_subscribes['all'][k](data)
					}
				}
			}
		})
	}

	subscribe(address, callback, name=false){
		if (!_subscribes[address]) { _subscribes[address] = {} }

		if (name && _subscribes[address][name]) {
			return
		}

		if (name===false) {
			name = Utils.makeSeed()
		};

		_subscribes[address][name] = callback

		return name
	}

	unsubscribe(address, callback, name=false){
		if (name!==false && _subscribes[address][name]) {
			delete(_subscribes[address][name])
			return
		}

		let new_subs = {}
		for(let k in _subscribes[address]){
			if (_subscribes[address][k] && _subscribes[address][k].toString() == callback.toString()) {
				continue
			}
			new_subs[k] = _subscribes[address][k]
		}
		_subscribes[address] = new_subs
	}


	// Подтверждение получения принятого сообщения
	acknowledgeReceipt(acquired_data){
		if (!acquired_data.user_id  || !acquired_data.action
			|| acquired_data.user_id == this.user_id
			|| acquired_data.action  == 'delivery_confirmation'
			|| acquired_data.action  == 'bankroller_active') {

			return
		}

		this.sendMsg({
			address:  acquired_data.address,
			seed:     Utils.makeSeed(),
			action:   'delivery_confirmation',
			acquired: acquired_data,
		})
	}


	// Проверка получения отправленного сообщения
	CheckReceipt(sended_data, callback){
		let subscribe_index = false

		let address = sended_data.address
		let waitReceipt = data => {
			if (!data.action || data.action != 'delivery_confirmation') {
				return
			}

			if (this.equaMsgs(sended_data, data.acquired) ) {
				this.unsubscribe(address, waitReceipt, subscribe_index)

				if (this.CheckReceiptsT[sended_data.seed]) {
					clearTimeout(this.CheckReceiptsT[sended_data.seed])
				}

				callback(true)
			}
		}

		subscribe_index = this.subscribe(address, waitReceipt)

		if (!this.CheckReceiptsT) {
			this.CheckReceiptsT = {}
		}

		this.CheckReceiptsT[sended_data.seed] = setTimeout(()=>{
			this.unsubscribe(address, waitReceipt, subscribe_index)

			callback(false)
		}, delivery_timeout)
	}

	equaMsgs(msg1, msg2){
		return (JSON.stringify(msg1) == JSON.stringify(msg2))
	}

	// Отправка сообщения с ожидание подтверждения получения
	send(data, callback=false, repeat=5){
		if (!this.channel) {
			setTimeout(()=>{ this.send(data, callback) }, 1000)
			return
		}

		data = this.sendMsg(data)

		if (!data.address) {
			return
		}

		this.CheckReceipt(data, delivered=>{
			if (!delivered && repeat > 0) {
				repeat--
				this.send(data, callback, repeat)
				return
			}

			if (callback) callback(delivered)
		})
	}

	sendMsg(data){
		data.user_id = this.user_id

		this.channel.set(this.user_id, JSON.stringify(data))

		return data
	}
}
