import _config  from 'app.config'
import Eth from 'Eth/Eth'
import QR from 'qrcode-svg'

import './wallet.less'

<wallet>
	<script>
		this._config = _config
		this.address = false
		this.balance = {
			eth: '...',
			bet: '...',
		}

		this.on('mount', ()=>{
			this.updateWallet()
		})

		this.updateWallet = ()=>{
			if (!Eth.Wallet.get().openkey) {
				setTimeout(()=>{
					this.updateWallet()
				},500)
				return
			}
			this.address = Eth.Wallet.get().openkey
			this.update()


			// this.QRcode = QR.toDataURL(this.address, 4);
			// this.QRcode = QR.toDataURL(this.address, 4);
			console.log(this.refs.wallet_qr_code)
			this.refs.wallet_qr_code.innerHTML = new QR({
				content: this.address,
				padding: 2,
				width: 190,
				height: 190,
				color: "#d99736",
				background: "#202020",
				ecl: "M"
			}).svg()

			Eth.getEthBalance(this.address, (balance_eth)=>{
				this.balance.eth = balance_eth
				this.update()
			})

			Eth.getBetsBalance(this.address, (balance_bet)=>{
				this.balance.bet = balance_bet
				this.update()
			})
		}
	</script>
	<div class="wallet-wrap">
		<div class="address" if={address}>
			<svg ref="wallet_qr_code"></svg>

			<a class="etherscan" href="https://{_config.network}.etherscan.io/address/{address}" target="_blank" rel="noopener">etherscan</a>

			<label>Account Address:</label>

			<input type="text" value="{address}" size="42">

		</div>

		<div class="balance">
			<label>Account Balance:</label>
			<span if={balance.eth}>
				<b>{balance.eth}</b> ETH
			</span>
			<span if={balance.eth}>
				<b>{balance.bet}</b> BET
			</span>
		</div>
	</div>

</wallet>
