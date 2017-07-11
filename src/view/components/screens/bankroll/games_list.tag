import _config  from 'app.config'
import Games    from 'games'
import route    from 'riot-route'

<games_list>
	<script>
		this.contracts = {}
		this.games     = {}
		this.seeds     = []

		this.bj_games   = {}
		this.slot_games = {}

		this.on('mount', ()=>{

			if (Games.BJ) {
			setInterval(()=>{
				for(let u in Games.BJ.Games){
				for(let k in Games.BJ.Games[u]){
					let g = Games.BJ.Games[u][k]

					this.bj_games[k] = g

					let cards_str = ''
					let game = g.getGame()

					let cards = {
						my:    game.curGame.arMyCards,
						split: game.curGame.arMySplitCards,
						house: game.curGame.arHouseCards,
					}

					for(let c in cards){
						cards_str += ' | '+c+':'
						cards[c].forEach(num=>{
							cards_str += ' ['+g.getValCards(num)+'] '
						})
					}

					this.bj_games[k].cards = cards_str
				}
				}
				this.update()
			}, 3000)
			};


			if (Games.Slots) {
				setInterval(()=>{
					for(let k in Games.Slots.Games){
						this.slot_games[k] = Games.Slots.Games[k].getResult()
					}
					this.update()
				}, 300)
			};

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
			console.log('list mount')
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
					<th>cards</th>
					<th>end</th>
					<th>money</th>
					<th>win</th>
				</tr>
			</thead>
			<tbody>
				<tr each={g in bj_games}>
					<td>{g.cards}</td>
					<td>{g.getGame().result}</td>
					<td>{g.getResult().profit*-1}</td>
					<td>m:{g.getResult().main}, s:{g.getResult().split}</td>
				</tr>
			</tbody>
		</table>

		<table if={Object.keys(slot_games).length} >
			<caption>SLOT games</caption>

			<thead>
				<tr>
					<th>rnd</th>
					<th>user bets</th>
					<th>user win</th>
				</tr>
			</thead>
			<tbody>
				<tr each={g in slot_games}>
					<td>{g.rnd}</td>
					<td>{g.balance}</td>
					<td>
						<span if={g.result}>win</span>
						<span if={!g.result}>loose</span>
					</td>
				</tr>
			</tbody>

		</table>

		<table if={Object.keys(games).length && Object.keys(seeds).length} class="seeds">
			<caption>DICE Games</caption>
			<thead>
				<tr>
					<th>TX</th>
					<th>Contract</th>
					<th>status</th>
					<th>random</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr each={s in seeds}>
					<td><a href="{s.tx_link}" target="_blank" rel="noopener" class="address" title="{s.tx}">{s.tx}</a></td>
					<td>
						<a  if={s.contract}
							href="{s.contract_link}"
							title="{s.contract}"
							class="address" target="_blank" rel="noopener">
							{s.meta_code}
						</a>
					</td>
					<td>
						<span if={!s.confirm_sended_server && !s.confirm_sended_blockchain}>pending...</span>
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
