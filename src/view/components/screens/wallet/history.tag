import _config  from 'app.config'
import TxHistory from 'txhistory'
import './history.less'
<history>

	<script>
		this.etherscan_url = _config.etherscan_url

		this.history = []

		this.on('mount', ()=>{
			TxHistory.subscribe( history => {
				if (history.length) {
					this.history = history
					this.update()
				}
			})
		})

		this.copy = (e)=>{
			e.preventDefault()
			if (!e.target.value) {
				return
			}

			App.view.copyToClipboard( e.target.value )
		}

	</script>

	<div class="history" >
		<h3 if={history.length}>History</h3>
		<!-- <div if={!history.length} class="empty">transactions history empty...</div> -->

		<div each={trans in history} class={
			transaction: true,
			incoming:    trans.in,
			outcoming:   trans.out,
			bet:         trans.tokens,
		}>
			<time>{trans.time}</time>
			<label if={trans.to}><span>tx:</span>
			<a class="tx" href="{etherscan_url}/tx/{trans.tx}" target="_blank" rel="noopener">
				{trans.tx}
			</a>
			</label>

			<span class="amount">
				<em>{trans.amount}</em>
				<span if={trans.tokens}>bet</span>
				<span if={!trans.tokens}>eth</span>
			</span>

			<label if={trans.from}><span>from:</span>
				<input onclick={copy} value={trans.from} class="from" type="text">
				<a class="blockchain" href="{etherscan_url}/address/{trans.from}" target="_blank" rel="noopener">blockchain</a>
			</label>
			<label if={trans.to}><span>to:</span>
				<input onclick={copy} value={trans.to} class="tx" type="text">
				<a class="blockchain" href="{etherscan_url}/address/{trans.to}" target="_blank" rel="noopener">blockchain</a>
			</label>
		</div>
	</div>
</history>
