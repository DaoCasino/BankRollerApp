import $ from 'jquery'
import _config from '../app.config.js'
import localDB from 'localforage'

import riot from 'riot'
import route from 'riot-route'

// import {reverseForIn} from 'model/Utils'
import {reverseForIn} from 'utils'

export default class View {
	constructor() {
		this.importTags()

		riot.mount('*')

		this.routing()
	}

	importTags() {
		let tc = require.context('./components/', true, /\.tag$/)
		tc.keys().forEach(function(path){ tc(path) })
	}

	routing() {
		route.base('/')
		route.start(true)
	}

	transactionsUpdate(){
		setInterval(()=>{
			localDB.getItem('seeds_list', (err, seeds_list)=>{
				if (seeds_list) {
					this.renderTXs(seeds_list)
				}
			})
		}, 5000)
	}

	renderTXs(seeds){
		let html = ''
		let max_cnt = 10
		reverseForIn(seeds, (seed)=>{
			max_cnt--
			if (max_cnt < 0) {
				return
			}

			let info = seeds[seed]
			let status = 'wait'
			if (info.confirm_sended_server) {
				status = 'on server'
			}
			if (info.confirm_sended_blockchain) {
				status = 'on blockchain'
			}
			if (!info.contract) {
				info.contract = ''
			}

			html += `<tr>
				<td class="seed">
				<a  class="address"
					target="_blank" rel="noopener"
					title="${seed}"
					href="https://${_config.network}.etherscan.io/tx/${seed}">
						${seed}
				</a>
				</td>
				<td class="seed">
				<a  class="address"
					target="_blank" rel="noopener"
					title="${info.contract}"
					href="https://${_config.network}.etherscan.io/${info.contract}">
						${info.contract}
				</a>
				</td>
				<td class="status">
					${status}
				</td>
				<td class="confirm">
					<span title="Server:${info.confirm_server} blockchain:${info.confirm_blockchain}">${info.confirm}</span>
				</td>
			</tr>`
		})

		html = `<table class="seeds">
			<thead>
				<tr>
					<th>TX</th>
					<th>Contract</th>
					<th>status</th>
					<th>random</th>
				</tr>
			</thead>
			<tbody>
				${html}
			</tbody>
		</table>`

		$('#content table.seeds').remove()
		$('table#games').after(html)
	}
}
