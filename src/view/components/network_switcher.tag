import _config from 'app.config'
import DB      from 'DB/DB'
<network_switcher>
	<script>
		this.current_network = false
		this.networks        = []

		this.showRPCform = false

		this.on('mount', ()=>{
			for(let code in _config.networks){
				let n = {
					code: code,
					name: _config.networks[code].name
				}
				this.networks.push(n)
				if (code==_config.network) {
					this.current_network = n
				}
			}

			setTimeout(()=>{
				DB.data.get('current_network').on( n => {
					console.log(n)
				})
			},1000)

			this.custom_network_url   = localStorage.custom_network_url || 'http://localhost:8545'
			this.custom_network_erc20 = localStorage.custom_network_erc20


			this.update()
		})

		this.selectNetwork = (e)=>{
			if (this.current_network.code==e.item.network.code && e.item.network.code!='custom') {
				return
			}

			if (!confirm('After change network, app will be restarted')) {
				return
			}

			let url = '', erc20 = ''
			if (e.item.network.code == 'custom') {
				this.current_network = _config.networks[ e.item.network.code ]
				this.update()

				this.showRPCform = true
				this.update()
				return
			}

			this.setNetwork({
				code:  e.item.network.code,
				url:   url,
				erc20: erc20,
			})
		}

		this.setNetwork = (network)=>{
			this.current_network = _config.networks[network.code]
			this.update()

			DB.data.get('network').put({
				code:  network.code,
				url:   network.url,
				erc20: network.erc20,
			}, ack=>{ console.log(ack) })

			localStorage.setItem('current_network',      network.code)
			localStorage.setItem('custom_network_url',   network.url)
			localStorage.setItem('custom_network_erc20', network.erc20)

			setTimeout(()=>{
				window.location.reload()
			}, 1000)

		}

		this.setCustomRPC = (e)=>{
			e.preventDefault()

			let url   = this.refs.rpc_url.value
			let erc20 = this.refs.rpc_erc20.value

			if (!url) {
				return
			}

			this.setNetwork({
				code:  'custom',
				url:   url,
				erc20: erc20,
			})

			this.update()
		}

		this.hideRPCform = (e)=>{
			this.current_network      = _config.networks[localStorage.current_network]
			this.current_network.code = localStorage.current_network
			this.showRPCform          = false
			this.update()
		}
	</script>

	<div class="network">
		<span if={current_network} class="current">
			<i class="{current_network.code}"></i>
			<b>{current_network.name}</b>
		</span>

		<svg class="arrow" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="11" height="8" viewBox="0 0 11 8"><defs id="SvgjsDefs1012"></defs><path id="SvgjsPath1013" d="M1427.37 73.276L1422.1899999999998 66.9576L1432.61 67.0027Z " fill="#ffffff" fill-opacity="1" transform="matrix(1,0,0,1,-1422,-66)"></path></svg>

		<ul if={networks}>
			<li each={network in networks} onclick={selectNetwork} class="ripple">
				<i class="{network.code}"></i>
				<b>{network.name}</b>
				<div if={network.code==current_network.code} class="check">✓</div>
			</li>
		</ul>
	</div>

	<form if={showRPCform} onsubmit={setCustomRPC} class="custom-rpc-form">
		<label>url:
			<input ref="rpc_url" type="text" name="url" value={custom_network_url}>
		</label>
		<label>erc20address:
			<input ref="rpc_erc20" type="text" name="erc20" value={custom_network_erc20}>
		</label>
		<a href="#" onclick={hideRPCform} class="cancel">Cancel</a>
		<input type="submit" class="button" value="Connect">
	</form>

	<style type="less">
		.custom-rpc-form {
			position: absolute; top:45px; right:5px;

			width:300px; height:240px; overflow:hidden;
			padding: 20px 30px;

			background:#222;
			box-shadow:0 5px 5px 0px rgba(0,0,0,0.3);

			label {
				text-transform: uppercase; font-weight: 200;
				display:block;
				margin-bottom: 20px;
				width:100%;
				input {
					padding-left: 0; width:100%;
				}
			}

			a.cancel {
				display:inline-block;
				margin: 18px 10px 10px 10px;
				float: left;
			}

			input[type="submit"] {
				display:inline-block;
				float: right;
				opacity:0.9;
				&:hover {
					opacity:1;
				}
			}
		}


		.network {
			display: inline-block;

			height: 45px;
			box-sizing: border-box;

			.arrow {  display:block;
				width:8px; height:10px;
				position:absolute; right:10px; top:15px;

				transition:transform 0.2s linear;
				opacity: 0.5;
			}

			.current {
				cursor:pointer;
				display: inline-block;
				height: 45px;
				padding:13px 30px 10px 20px;
				color:#aaa;
				font-size:12px;
			}

			i {
				display: inline-block;
				height: 9px;
				min-width: 9px;
				margin: 0 10px 0 0;

				/*background: #000; */
				border: 1px solid #EBB33F;

				&.mainnet {
					/*transform: rotate(45deg);*/
					/*background: #038789;*/
					border:none;
					&:after {
						content:'♦'; font-size: 18px;
						color: #97abcc;
						line-height: 0;
					}
				}

				&.ropsten {
					background: #E91550;
					color: white;
					border-radius: 10px;
					border:none;
				}

				&.rinkeby {
					background: #EBB33F;
					border:none;
				}
			}


			ul {
				li {
					cursor: pointer;
					position:relative;
					font-size:11px;
					padding:15px 30px 15px 20px;

					.check {
						color: #aaa;
						position:absolute; top:13px; right:7px;
						font-size:14px;
					}

					&:hover {
						background:#2c2c2c;
					}

					&:last-child {
						border-radius:0px 0px 4px 4px;
					}
				}
			}

			overflow: hidden;
			&:hover {
				.current { cursor:default; }
				overflow: inherit; height:auto;
				background:#272727;
				border-radius:4px;
			}
		}

	</style>
</network_switcher>
