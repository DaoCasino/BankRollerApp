import _config from 'app.config'

<network_switcher>
	<script>
		this.current_network = false
		this.networks = []
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

			this.update()
		})

		this.selectNetwork = (e)=>{
			if (this.current_network.code==e.item.network.code) {
				return
			}
			this.current_network = e.item.network
			this.update()

			localStorage.setItem('current_network', e.item.network.code)
			setTimeout(()=>{
				window.location.reload()
			}, 1000)
		}
	</script>

	<div class="network">
		<span if={current_network} class="current">
			<i class="{current_network.code}"></i>
			<b>{current_network.name}</b>
		</span>
		<ul if={networks}>
			<li each={network in networks} onclick={selectNetwork}>
				<i class="{network.code}"></i>
				<b>{network.name}</b>
				<div if={network.code==current_network.code} class="check">✓</div>
			</li>
		</ul>
	</div>
	<style type="less">
		.network {
			display: inline-block;

			height: 45px;
			box-sizing: border-box;

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
				&.mainnet {
					transform: rotate(45deg);
					background: #038789;
				}

				&.ropsten {
					background: #E91550;
					color: white;
					border-radius: 10px;
				}

				&.rinkeby {
					background: #EBB33F;
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
