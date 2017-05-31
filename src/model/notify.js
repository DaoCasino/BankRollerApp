import DB from 'DB/DB'

let db_key = 'msgs2'

export default new class Notify {
	constructor() {
		// subscribe to new notifies in client
		if (process.env.NODE_ENV !== 'server') {
			this.subscribe()

			this.Toastr = require('toastr')
		}
	}

	subscribe(){
		DB.data.get(db_key).map().on( (msg, msg_id) => {
			if (!msg) { return }

			this.send(msg.title, msg.body)

			setTimeout( ()=>{
				DB.data.get(db_key).get(msg_id).put(null)
			}, 1000 )
		} )
	}

	send(title, body){
		// in server add msg to database
		if (process.env.NODE_ENV === 'server') {
			this.sendServer(title, body)
			return
		}

		this.sendClient(title, body)
	}

	sendServer(title, body){
		let msg_id = 'msg_' + new Date().getTime()
		DB.data.get(db_key).get(msg_id).put({
			title: title,
			body:  body,
		})

		this.electronTrayNotify()
	}

	sendClient(title, body){
		clearTimeout(this.sendTimeLimit)
		this.sendTimeLimit = setTimeout(()=>{

			// is Electron app
			if (typeof proccess !== 'undefined' && process.versions && process.versions.electron) {
				this.electronNotify(title, body)
			}

			this.Toastr().info(title, body)
		}, 3000)
	}

	electronTrayNotify(title, body){
		if (typeof Tray !=='undefined' && Tray.displayBalloon) {
			Tray.displayBalloon({
				title:   title,
				content: body,
			})
		}
	}

	electronNotify(title, body){
		let r = new Notification(title, {
			title: title,
			body:  body,
		})
		console.log(r)
	}

}
