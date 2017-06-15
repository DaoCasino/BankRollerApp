import _config   from 'app.config'
import route     from 'riot-route'
import Eth       from 'Eth/Eth'
import TxHistory from 'txhistory'
import toastr    from 'toastr'
import $         from 'jquery'

import './send.less'

<send>
	<script>
		this.balance = {
			eth: 1,
			bet: 1,
		}

		this.tab = 'bet'

		this.on('mount', ()=>{
			let send_bets_to = route.query().to
			if (send_bets_to) {
				this.refs.bet_to.value     = send_bets_to
				this.refs.bet_amount.value = 1

				// this.refs.bet_send_form.scrollIntoView({block: "end", behavior: "smooth"})
				setTimeout(()=>{
					$('html,body').animate({scrollTop:270}, 400)
				}, 500)
			}
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

			this.lock_betform = true
			this.update()

			let to     = this.refs.bet_to.value
			let amount = this.refs.bet_amount.value

			this.refs.bet_to.value     = ''
			this.refs.bet_amount.value = 0

			Eth.sendBets(to, amount, transaction => {
				console.log('Eth.sendBets transaction', transaction)
				toastr.success(amount+' BET succefull sended', 'Bets sended')

				TxHistory.add({
					out:    true,
					tokens: true,
					tx:     transaction,
					to:     to,
					amount: amount,
				})

				setTimeout(()=>{
					this.lock_betform = false
					this.update()
				}, 2000)
			})
		}


		this.sendEth = (e)=>{
			e.preventDefault()
			if (!this.refs.eth_to.validity.valid || !this.refs.eth_amount.validity.valid){
				this.refs.eth_send_form.classList.add('error')
				return
			}

			let to     = this.refs.eth_to.value
			let amount = this.refs.eth_amount.value

			this.lock_ethform = true
			this.update()

			Eth.sendEth(to, amount, transaction => {
				console.log('Eth.sendEth transaction', transaction)

				toastr.success(amount+' ETH succefull sended', 'Eth sended')

				TxHistory.add({
					out:    true,
					tokens: false,
					tx:     transaction,
					to:     to,
					amount: amount,
				})

				setTimeout(()=>{
					this.lock_ethform = false
					this.update()
				}, 2000)
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

		<form id="send_bets"
			ref="bet_send_form"
			if={(this.tab=='bet')}
			class={locked:lock_betform}
		>

			<label>
				<span>to:</span>
				<input onkeyup={checkValid} ref="bet_to" placeholder="0x8ac300f0dd296145380424a9118ac59d32c8c6a5" required minlength="42" maxlength="42" type="text" name="to">
			</label>
			<label>
				<span>amount:</span>
				<input onkeyup={checkValid} ref="bet_amount" placeholder="1.00" required name="bet_amount" type="number" step="0.001" min="0.001" max="{balance.bets}"> BET
			</label>

			<button onclick={sendBet} class="button">send</button>
		</form>

		<form id="send_eth"
			ref="eth_send_form"
			if={(this.tab=='eth')}
			class={locked:lock_ethform}
		>
			<label>
				<span>to:</span>
				<input onkeyup={checkValid} ref="eth_to" placeholder="0x8ac300f0dd296145380424a9118ac59d32c8c6a5" required minlength="42" maxlength="42" type="text" name="to">
			</label>
			<label>
				<span>amount:</span>
				<input onkeyup={checkValid} ref="eth_amount" placeholder="1.00" required name="eth_amount" type="number" step="0.001" min="0.001" max="{balance.eth}"> ETH
			</label>

			<button onclick={sendEth} class="button">send</button>
		</form>
	</div>

</send>
