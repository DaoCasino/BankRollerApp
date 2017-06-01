import _config  from 'app.config'
import {Wallet} from 'Eth/Eth'
import Games    from 'games'

import './games.less'
import './games_list'

<bankroll>
	<script>
		this.loading = true
		this.games = _config.games
		this.on('mount', ()=>{
			this.loading = false
			this.update()
		})

		this.deployGame = (e)=>{
			e.preventDefault()

			this.loading = true
			this.loading_status = 'Add task to deploy  "'+this.refs.game_name.value+'" contract'
			this.update()

			Games.create(this.refs.game_name.value)

			setTimeout(()=>{
				this.loading = false
				this.loading_status =  ''
				this.update()
			},2000)
		}

		this.addContract = (e)=>{
			e.preventDefault()

			this.loading = true
			this.loading_status = 'Add contract...'
			this.update()

			let contract_id = this.refs.contract_id.value.split(' ').join('')

			Games.add(false, 'unknow', contract_id, (info)=>{
				this.loading = true
				this.loading_status = 'Game added!'

				setTimeout(()=>{
					this.loading = false
					this.loading_status = ''
					this.update()
				},2000)
			})
		}
	</script>

	<div id="bankroll" class={screen:true, loading:this.loading}>
		<div id="loading_status">{loading_status}</div>

		<games_list></games_list>

 		<div class="game-add-forms">
		  <form id="add_game_form" onsubmit={deployGame}>
			<fieldset>
				<legend>Deploy new game contract</legend>
				<select ref="game_name" required>
					<option selected="selected" value="">Select game</option>
					<option each={game in games} value="{game.code}">{game.name}</option>
				</select>
				<button class="button" id="create_new_game">Create</button>
			</fieldset>
		  </form>
		  <form id="add_contract_form" onsubmit={addContract}>
			<fieldset>
				<legend>or add existing game contract</legend>
				<input ref="contract_id" placeholder="Contract ID" type="text" name="contract_id" id="contract_id" required autocomplete="off">
				<button class="button" id="add_game_contract_id">Add</button>
			</fieldset>
		  </form>
		</div>
	</div>

	<style type="less">

	</style>

</bankroll>
