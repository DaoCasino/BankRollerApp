import _config  from 'app.config'
import Games    from 'games'
import route    from 'riot-route'

<games_list>
	<script>
		this.contracts = {}
		this.games     = {}
		this.seeds     = []

		this.bj_games   = {}
		this.dd_games   = []

		this.on('mount', ()=>{

			setInterval(()=>{
				if (DiceGameChannel.Games) {
					this.dd_games = []
					for(let k in DiceGameChannel.Games){
						for(let j in DiceGameChannel.Games[k].history){
							var s = Object.assign({channel:k}, DiceGameChannel.Games[k].history[j])
							s.user_bet = (s.user_bet/100000000).toFixed(2)
							s.profit   = (s.profit/100000000).toFixed(2)
							s.balance  = (s.balance/100000000).toFixed(2)
							this.dd_games.push(s)
						}
					}
					this.update()
				}
			}, 3000)

			setInterval(()=>{
				if (Games.BJ_m) {
					this.bj_games = Games.BJ_m.getViewData()
					this.update()
				}
			}, 3000)

		})

		this.on('update', ()=>{
			// console.log('list update')
		})

		this.upd = ()=>{
			clearTimeout(this.updt)
			this.updt = setTimeout(()=>{
				this.update()
			}, 200)
		}

		this.on('mount', ()=>{
			this.subscribeGames()
			this.subscribeSeeds()
		})

		this.subscribeGames = ()=>{
			this.games = {}

			Games.subscribe('Games').on( (game, game_id)=>{
				if (!game || !game_id) { return }

				let bankroll = 0
				if (game.start_balance) {
					bankroll = game.start_balance.toFixed(4)
				}

				let profit = (+game.balance - +game.start_balance).toFixed(4)
				if (isNaN(profit)) {
					profit = 0
				}

				let contract_id = game.contract_id

				let contract_link = `${_config.etherscan_url}/address/${contract_id}`

				let game_url = false
				if (_config.games[game.game]) {
					game_url = _config.games[game.game].url+'?address='+contract_id
				}

				if (game.deploying) {
					game_url      = false
					contract_id   = false
					contract_link = false
				}

				this.contracts[contract_id] = game.meta_code

				this.games[game_id] = {
					game_id:       game_id,
					url:           game_url,
					contract_id:   contract_id,
					contract_link: contract_link,
					profit:        profit,
					bankroll:      bankroll,
					meta_link:     game.meta_link,
					meta_version:  game.meta_version,
					meta_code:     game.meta_code,
					meta_name:     game.meta_name,
				}

				this.upd()
			})
		}

		this.subscribeSeeds = ()=>{
			let seeds = {}

			Games.subscribe('seeds_list').on((data, seed)=>{
				if (!data || !this.contracts[data.contract]) { return }

				data.seed      = seed
				data.meta_code = this.contracts[data.contract]
				data.tx_link   = _config.etherscan_url+'/tx/'+data.tx
				seeds[seed]    = data

				this.seeds = []
				for(let k in seeds){
					this.seeds.push(seeds[k])
				}
				this.seeds = this.seeds.reverse().slice(0,10)

				this.upd()
			})
		}

		this.addBets = (e)=>{
			e.preventDefault()
			route('/wallet/sendBets/?to='+e.item.game.contract_id)
		}
		this.remove = (e)=>{
			e.preventDefault()
			if (!confirm('You really want to stop game?')) {
				return
			}

			Games.remove(e.item.game.game_id)
			delete( this.games[e.item.game.game_id] )
			this.update()
		}
	</script>

	<div class="game-stat">

		<!-- <div if={!Object.keys(games).length} class="no-games">You have no active games...</div> -->

		<table if={Object.keys(games).length} id="games">
		<caption>Games, contracts</caption>
		<thead><tr>
			<th>Game URL</th>
			<th>contract</th>
			<th>bankroll</th>
			<th>profit</th>
			<th>actions</th>
		</tr></thead>
		<tbody>
			<tr each={game in games} data-bankroll={Math.floor(game.bankroll)}>
				<td>
					<a if={game.url} href="{game.url}" target="_blank" rel="noopener">
						<span if={game.meta_name}>{game.meta_name}</span>
						<span if={!game.meta_name}>{game.url}</span>
					</a>
				</td>
				<td>
					<span if={!game.contract_id}>Deploying...</span>
					<a  if={game.contract_id}
						href="{game.contract_link}"
						title="{game.contract_id}"
						class="address" target="_blank" rel="noopener">
						<span if={game.meta_version} title="version:{game.meta_version}">{game.meta_code}</span>
						<span if={!game.meta_version}>{game.contract_id}</span>
					</a>
				</td>
				<td>{game.bankroll}</td>
				<td>
					<span if={game.profit > 0} style="color:green">{game.profit} bet</span>
					<span if={game.profit < 0} style="color:red">{game.profit} bet</span>
					<span if={game.profit == 0} >{game.profit} bet</span>
				</td>
				<td>
					<a if={game.contract_id} href="#addBets" onclick={addBets} class="remove">+bets</a>
					&nbsp;&nbsp;
					<a if={game.contract_id} href="#remove" onclick={remove} class="remove">refund</a>
					<a if={!game.contract_id} href="#remove" onclick={remove} class="remove">remove</a>
				</td>
			</tr>
		</tbody>
		</table>

		<table if={Object.keys(bj_games).length} >
			<caption>BJ games</caption>

			<thead>
				<tr>
					<th>Room</th>
					<th>State</th>
					<th>PLayer 1</th>
					<th>PLayer 2</th>
					<th>PLayer 3</th>
				</tr>
			</thead>
			<tbody>
				<tr each={room in bj_games}>
					<td><span style="max-width: 100px; text-overflow: ellipsis">{room.room_hash}</span></td>
					<td>{room.state}</td>
					<td each={user in room.users}>
						deposit:{(user.deposit/100000000).toFixed(2)}
						<br>
						balance:{(user.balance/100000000).toFixed(2)}
						<br>
						points:{user.points}
						<br>
						house:{user.house}
						<br>
						my:{user.my}
					</td>
				</tr>
			</tbody>
		</table>



		<table if={Object.keys(dd_games).length} class="seeds">
			<caption>DICE GameChannels Games</caption>
			<thead>
				<tr>
					<th>Channel</th>
					<th>bet</th>
					<th>num</th>
					<th>rnd_seed</th>
					<th>random</th>
					<th>profit</th>
					<th>balance</th>
				</tr>
			</thead>
			<tbody>
				<tr each={s in dd_games}>
					<td><span class="address">{s.channel}</a></td>
					<td><span class="address">{s.user_bet}</a></td>
					<td><span class="address">{s.user_num}</a></td>
					<td><span class="address">{s.random_hash}</a></td>
					<td><span class="address">{s.random_num}</a></td>
					<td><span class="confirm">{s.profit}</span></td>
					<td><span class="confirm">{s.balance}</span></td>
					<td></td>
				</tr>
			</tbody>
		</table>
	</div>
</games_list>
