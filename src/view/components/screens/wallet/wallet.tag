import _config  from 'app.config'

import Api from 'Api'
import Eth from 'Eth/Eth'

import QR from 'qrcode-svg'
import toastr from 'toastr'
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
			this.testnet = _config.network!=='mainnet'
			this.updateWallet()

			setInterval(()=>{
				this.updateWallet()
			}, 30*1000)
		})


		/*
		 * Init wallet and get balance
		 */
		this.updateWallet = ()=>{
			if (!Eth.Wallet.get().openkey) {
				setTimeout(()=>{
					this.updateWallet()
				},500)
				return
			}
			this.address = Eth.Wallet.get().openkey
			this.update()

			this.refs.wallet_qr_code.innerHTML = new QR({
				content:    this.address,
				padding:    2,
				width:      190,
				height:     190,
				color:      "#d99736",
				background: "#202020",
				ecl:        "M"
			}).svg()


			Eth.getEthBalance(this.address, (balance_eth)=>{
				if (balance_eth===0) {
					balance_eth = '0'
				}
				this.balance.eth = balance_eth
				this.update()
			})

			Eth.getBetsBalance(this.address, (balance_bet)=>{
				if (balance_bet===0) {
					balance_bet = '0'
				}
				this.balance.bet = balance_bet
				this.update()
			})
		}




		this.copy = (e)=>{
			e.preventDefault()
			if (!e.target.value) {
				return
			}

			App.view.copyToClipboard( e.target.value )
		}


		/*
		 * Get test BETs
		 */
		this.getTestBets_proccess = false
		this.bets_requested = localStorage.getItem('bets_requested_'+_config.network)
		this.getTestBets = (e)=>{
			e.preventDefault()
			this.getTestBets_proccess = true
			this.update()

			Api.addBets(this.address).then(()=>{
				localStorage.setItem('bets_requested_'+_config.network, true)
				toastr.info('Request sended', 'Please waiting')
			})
		}


		/*
		 * Export
		 */
		this.private_key = ''
		this.exportPrivateKey = ()=>{
			Eth.Wallet.exportPrivateKey(private_key=>{
				App.view.copyToClipboard( private_key )
				this.private_key = private_key
				this.update()
				setTimeout(()=>{
					this.private_key = ''
					this.update()
				}, 5000)
			})
		}

	</script>
	<div id="wallet">
	<div if={!address} class="wallet-wrap">
		<spinner text="Loading your wallet, please wait one moment..."></spinner>
	</div>
	<div if={address} class="wallet-wrap">
		<div class="address">
			<svg ref="wallet_qr_code"></svg>

			<a class="etherscan" href="{_config.etherscan_url}/address/{address}" target="_blank" rel="noopener">blockchain</a>

			<label>Account Address:</label>

			<div onclick={copy}>
			<input disabled="disabled" type="text" value="{address}" size="42">
			</div>
		</div>

		<div class={balance:true}>
			<button if={bets_requested} class="bets-requested">free bets requested</button>
			<button class={loading:getTestBets_proccess} if={testnet && !bets_requested} onclick={getTestBets}>get test bets</button>

			<label>Account Balance:</label>
			<span>
				<b if={!balance.eth} class="loading">:.</b>
				<b if={balance.eth}>{balance.eth}</b> ETH
			</span>
			<span>
				<b if={!balance.bet} class="loading">.:</b>
				<b if={balance.bet}>{balance.bet}</b> BET
			</span>
		</div>


		<div class="export">
			<label>Export private key:</label>
			<input onclick={copy} value="{private_key}" disabled="disabled" type="text" placeholder="****************************************************************************************************************************************">
			<button onclick={exportPrivateKey} class="ripple">Export</button>
			<p>
				You can access to your wallet by Private Key in services like
				<a target="_blank" rel="noopener" href="https://www.myetherwallet.com/#view-wallet-info">myetherwallet</a> or <a target="_blank" rel="noopener" href="https://metamask.io/">metamask</a>
			</p>
		</div>
	</div>
	</div>
</wallet>
