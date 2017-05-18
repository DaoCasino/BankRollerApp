import $ from 'jquery'
import _config from '../app.config.js'
import localDB from 'localforage'


function reverseForIn(obj, f) {
	let arr = []
	for (let key in obj) {
		arr.push(key)
	}
	for (let i=arr.length-1; i>=0; i--) {
		f.call(obj, arr[i])
	}
}

class View {
	constructor() {
		this.$content = $('#content')
	}

	loading(load, status=''){
		this.$content.removeClass('loading')
		this.$content.removeClass('loading')
		if (load) {
			this.$content.addClass('loading')
		}
		$('#loading_status').text(status)
	}

	onContractAdd(callback){
		let $input = $('#contract_id')

		$('#add_contract_form').on('submit', (e)=>{
			e.preventDefault()

			let contract_id = $input.val()

			$input.val('')

			callback(contract_id)
		})
	}
	onGameAdd(callback){
		$('#add_game_form').on('submit', (e)=>{
			e.preventDefault()

			callback( $('#add_game_form select').val() )
		})
	}

	renderGamesList(games){
		if (!games || !Object.keys(games).length) {
			$('table#games').hide()
			$('table#games tbody').html('')
			return
		}

		let games_html = ''
		for(let contract_id in games){
			let game     = games[contract_id]
			let bankroll = game.start_balance
			let profit   = (+game.balance - +game.start_balance).toFixed(4)

			// TODO: delta +30-205
			if (profit>0) {
				profit = '<span style="color:green">'+profit+' bet</span>'
			} else {
				profit = '<span style="color:red">'+profit+' bet</span>'
			}


			let game_url = _config.games.dice.url+'?address='+contract_id

			if (game.deploying) {
				game_url = '#'
				contract_id = '#deploying...'
			}

			games_html += `<tr>
				<td>
					<a  class="address"
						target="_blank" rel="noopener"
						title="${game_url}"
						href="${game_url}">
							${game_url}
					</a>
				</td>
				<td>
					<a  class="address"
						target="_blank" rel="noopener"
						title="${contract_id}"
						href="https://${_config.network}.etherscan.io/address/${contract_id}">
							${contract_id}
					</a>
				</td>
				<td>${bankroll}</td>
				<td class="profit">${profit}</td>
				<td>
					<a data-id="${contract_id}" href="#delete">remove</a>
				</td>
			</tr> `
			// <span>stop</span> <a href="#get_money">refund</a>
		}

		if (games_html) {
			$('table#games').show()
			$('table#games tbody').html(games_html)

			$('table#games tbody a[href="#delete"]').on('click',function(){
				if (confirm('Shure?')) {
					App.Games.remove( $(this).attr('data-id') )
					$(this).parent().parent().remove()
				}
			})
		}
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


export default new View()
