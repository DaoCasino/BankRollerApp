import _config  from 'app.config'
import Eth from 'Eth/Eth'

import './send.less'

<send>
	<script>
		this.balance = {
			eth: 1,
			bet: 1,
		}

		this.tab = 'bet'

		this.on('mount', ()=>{

		})

		this.tabEth = (e)=>{
			e.preventDefault()
			this.tab = 'eth'
			this.update()
		}
		this.tabBet = (e)=>{
			e.preventDefault()
			this.tab = 'bet'
			this.update()
		}


		this.checkValid = (e)=>{
			if ([this.refs.bet_to, this.refs.bet_amount].indexOf(e.target) > -1 ) {
				if (e.target.validity.valid) {
					this.refs.bet_send_form.classList.remove('error')
					return
				}
				this.refs.bet_send_form.classList.add('error')
			}

			if ([this.refs.eth_to, this.refs.eth_amount].indexOf(e.target) > -1 ) {
				if (e.target.validity.valid) {
					this.refs.eth_send_form.classList.remove('error')
					return
				}
				this.refs.eth_send_form.classList.add('error')
			}
		}

		this.sendBet = (e)=>{
			e.preventDefault()
			if (!this.refs.bet_to.validity.valid || !this.refs.bet_amount.validity.valid){
				this.refs.bet_send_form.classList.add('error')
				return
			}

			Eth.sendBets(this.refs.bet_to.value, this.refs.bet_amount.value, transaction => {
				console.log(transaction)
			})
		}

	</script>

	<div class="send">
		<div class="tabs">
			<span>Send:</span>
			<ul>
				<li class={active:(this.tab=='bet')}>
					<a class="ripple" href="#bets" onclick={tabBet}>Bets</a>
				</li>
				<li class={active:(this.tab=='eth')}>
					<a class="ripple" href="#eth" onclick={tabEth}>Eth</a>
				</li>
			</ul>
		</div>

		<form ref="bet_send_form" if={(this.tab=='bet')} id="send_bets">
			<label>
				<span>to:</span>
				<input onkeyup={checkValid} ref="bet_to" placeholder="0x8ac300f0dd296145380424a9118ac59d32c8c6a5" required minlength="42" maxlength="42" type="text" name="to">
			</label>
			<label>
				<span>amount:</span>
				<input onkeyup={checkValid} ref="bet_amount" placeholder="1.00" required name="amount" type="number" step="0.001" min="0.001" max="{balance.bets}"> BET
			</label>

			<button onclick={sendBet} class="button">send</button>
		</form>

		<form ref="eth_send_form" if={(this.tab=='eth')} id="send_eth">
			<label>
				<span>to:</span>
				<input onkeyup={checkValid} ref="eth_to" placeholder="0x8ac300f0dd296145380424a9118ac59d32c8c6a5" required minlength="42" maxlength="42" type="text" name="to">
			</label>
			<label>
				<span>amount:</span>
				<input onkeyup={checkValid} ref="eth_amount" placeholder="1.00" required name="amount" type="number" step="0.001" min="0.001" max="{balance.eth}"> ETH
			</label>

			<button onclick={sendEth} class="button">send</button>
		</form>
	</div>

</send>
