import _config  from 'app.config'
import Games    from 'games'

<games_list>
	<script>
		this.games = []

		this.on('update', ()=>{
		})
		this.on('mount', ()=>{
			this.getGames()
			setInterval(()=>{
				this.getGames()
			},2000)
		})

		this.getGames = ()=>{
			Games.get((games) => {
				this.games = []
				for(let contract_id in games){
					let game     = games[contract_id]
					let bankroll = game.start_balance.toFixed(4)

					let profit = (+game.balance - +game.start_balance).toFixed(4)
					if (isNaN(profit)) {
						profit = 0
					}

					let contract_link = `${_config.etherscan_url}/address/${contract_id}`

					let game_url = _config.games.dice.url+'?address='+contract_id
					if (_config.games[game.game]) {
						game_url = _config.games[game.game].url+'?address='+contract_id
					}

					if (game.deploying) {
						game_url      = false
						contract_id   = false
						contract_link = false
					}

					this.games.push({
						url:           game_url,
						contract_id:   contract_id,
						contract_link: contract_link,
						profit:        profit,
						bankroll:      bankroll,
					})
				}

				this.update()
			})

			Games.getSeeds(seeds=>{
				this.seeds = []
				for(let k in seeds){
					seeds[k].seed = k
					seeds[k].tx_link = `${_config.etherscan_url}/tx/${seeds[k].seed}`
					seeds[k].contract_link = `${_config.etherscan_url}/address/${seeds[k].contract}`
					this.seeds.push(seeds[k])
				}
				this.seeds = this.seeds.reverse().slice(0,10)
				this.update()
			})
		}


		this.remove = (e)=>{
			e.preventDefault()
			Games.remove(e.item.game.contract_id)
			setTimeout(()=>{ this.getGames() },100)
		}
	</script>

	<div class="game-stat">

		<span if={!games.length}>You have no active games...</span>

		<table if={games.length} id="games">
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
					<a if={game.url} href="{game.url}" target="_blank" rel="noopener">{game.url}</a>
				</td>
				<td>
					<span if={!game.contract_id}>Deploying...</span>
					<a  if={game.contract_id}
						href="{game.contract_link}"
						title="{game.contract_id}"
						class="address" target="_blank" rel="noopener">
						{game.contract_id}
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

		<table if={seeds} class="seeds">
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
						<span if={s.confirm_sended_blockchain}>in blockhain</span>
						<span if={s.confirm_sended_server}>sended to player</span>
					</td>
					<td>{s.confirm}</td>
					<td></td>
				</tr>
			</tbody>
		</table>
	</div>
</games_list>
