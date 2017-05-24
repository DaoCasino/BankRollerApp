import _config  from 'app.config'
import Games    from 'games'

<games_list>
	<script>
		this.games = []

		this.on('update', ()=>{
			console.log('games list update')
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
		}
	</script>

	<div class="game-stat">

		<span if={!games.length}>No games...</span>

		<table if={games.length} id="games">
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
					<a if={game.url} href="{game.url}">{game.url}</a>
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
				<td></td>
			</tr>
		</tbody>
		</table>
	</div>
</games_list>
