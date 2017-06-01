import _config  from 'app.config'
import './history.less'
<history>

	<script>
		this.history = [
			{
				time   : '2017-05-31 22:47',
				in     : true,
				tokens : true,
				summ   : 1.034,
				from   : '0x8b0333fa45185a03d4cdc98f6a40eba8a2c393f3',
				address: '0x8b0333fa45185a03d4cdc98f6a40eba8a2c393f3',
			},
			{
				time   : '2017-05-31 22:47',
				out    : true,
				tokens : false,
				summ   : 1.034,
				from   : '0x8b0333fa45185a03d4cdc98f6a40eba8a2c393f3',
				address: '0x8b0333fa45185a03d4cdc98f6a40eba8a2c393f3',
			},
		]
	</script>

	<div class="history" >
		<h3>History</h3>
		<div each={trans in history} class={
			transaction: true,
			incoming:    trans.in,
			outcoming:   trans.out,
			bet:         trans.tokens,
		}>
			<time>{trans.time}</time>

			<a class="etherscan" href="{_config.etherscan_url}/tx/{trans.address}" target="_blank" rel="noopener">blockchain</a>


			<span class="summ">
				<em>{trans.summ}</em>
				<span if={trans.tokens}>bet</span>
				<span if={!trans.tokens}>eth</span>
			</span>

			<label><span>from:</span>
				<input onclick={copy} value={trans.from} class="from" type="text">
			</label>
			<label><span>tx:</span>
				<input onclick={copy} value={trans.address} class="tx" type="text">
			</label>
		</div>
	</div>
</history>
