import GA from './ga'
import Charts from './charts'


<stat>
	<script>
		this.need_auth = false
		this.auth = false

		this.on('mount',()=>{
			if (GA.api && GA.api.analytics.auth.isAuthorized()) {
				this.loadData()
				return
			}

			GA.init(()=>{
				if (GA.api.analytics.auth.isAuthorized()) {
					this.loadData()
					return
				}

				GA.auth('auth_button')
				this.need_auth = true
				this.update()

				this.t = setInterval(()=>{
					if (GA.api.analytics.auth.isAuthorized()) {
						this.need_auth = false
						this.loadData()
					}
				},1000)
			})
		})

		this.loadData = ()=>{
			clearInterval(this.t)
			GA.getData(stat=>{

				Charts.render(stat)
			})
			this.auth = true
			this.update()
		}
	</script>
	<div class="stat-wrap">
		<div class={auth:true, show:need_auth}>
			<p>For see stats you need grant access </p>
			<section id="auth_button"></section>
		</div>

		<div if={auth} class="stat">
			<div id="chart"></div>
		</div>
	</div>

	<style type="less">
		.stat-wrap {
			margin: 40px 20px;
			width: 100%;
		}

		.auth {
			display: none;
			&.show { display: block;  }

			margin-top: 100px;
			p {
				text-align: center;
				font-size: 12px; margin: 10px;
			}
			#auth_button {
				display: block;
				width: 300px;
				text-align: center;
				cursor: pointer;
				margin: 0 auto;

				opacity: 0.8; transition:opacity 0.2s ease;
				&:hover {opacity: 0.9; }
			}
		}

		.stat {
			#chart {
				margin: 0 0 0 2%;
				max-width: 90%;
				.highcharts-title {
					letter-spacing: 2px;
					fill-opacity:0.2;
				}
			}
		}
	</style>
</stat>
