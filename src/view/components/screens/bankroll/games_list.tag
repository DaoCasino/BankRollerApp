import _config  from 'app.config'
import Games    from 'games'

<games_list>
	<script>
		this.games = {}
		this.seeds = []

		this.on('update', ()=>{
		})
		this.on('mount', ()=>{
			this.getGames()
		})

		this.getGames = ()=>{
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

				this.update()
			})

			this.seedUpd()
		}

		this.seedUpd = ()=>{
			let seeds = {}
			Games.subscribe('seeds_list').on((data, seed)=>{
				if (!data) { return }

				data.seed        = seed
				data.tx_link     = `${_config.etherscan_url}/tx/${seed}`
				seeds[seed] = data

				this.seeds = []
				for(let k in seeds){
					this.seeds.push(seeds[k])
				}
				this.seeds = this.seeds.reverse().slice(0,10)

				this.update()
			})
			setTimeout(()=>{ this.seedUpd() }, 4000)
		}

		this.remove = (e)=>{
			e.preventDefault()
			Games.remove(e.item.game.game_id)
			delete( this.games[e.item.game.game_id] )
			this.update()
		}
	</script>

	<div class="game-stat">

		<div if={!Object.keys(games).length} class="no-games">You have no active games...</div>

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
			<tr each={game in games}>
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
					<a href="#remove" onclick={remove} class="remove">remove</a>
				</td>
			</tr>
		</tbody>
		</table>

		<table if={Object.keys(games).length && Object.keys(seeds).length} class="seeds">
			<caption>Transactions</caption>
			<thead>
				<tr>
					<th>TX</th>
					<th>Contract</th>
					<th>status</th>
					<th>random</th>
					<th>actions</th>
				</tr>
			</thead>
			<tbody>
				<tr each={s in seeds}>
					<td><a href="{s.tx_link}" title="{s.seed}" class="address" target="_blank" rel="noopener">{s.seed}</a></td>
					<td>
						<a  if={s.contract}
							href="{s.contract_link}"
							title="{s.contract}"
							class="address" target="_blank" rel="noopener">
							{s.contract}
						</a>
					</td>
					<td>
						<span if={s.confirm_sended_server}>sended to player</span>
						<span if={s.confirm_sended_blockchain}>[in blockhain]</span>
					</td>
					<td><span class="confirm">{s.confirm}</span></td>
					<td></td>
				</tr>
			</tbody>
		</table>
	</div>
</games_list>
