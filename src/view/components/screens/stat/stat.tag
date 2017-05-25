import GA from './ga'
import Charts from './charts'


<stat>
	<script>
		this.auth         = false
		this.need_auth    = false
		this.ga_site_id   = false
		this.ga_view_id   = false
		this.ga_view_name = false

		this.on('mount',()=>{
			if (localStorage.ga_view_id) {
				this.ga_site_id   = localStorage.ga_site_id
				this.ga_view_id   = localStorage.ga_view_id
				this.ga_view_name = localStorage.ga_view_name
			}

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

			this.auth = true
			this.update()

			GA.getAccounts(accounts=>{
				this.accounts = accounts
				this.update()
			})

			this.renderChart()
		}

		this.selectAccount = ()=>{
			this.views = false
			GA.getSites(this.refs.account_id.value, sites=>{
				this.sites = sites
				this.update()

				if (this.sites.length==1) {
					this.refs.site_id.value = this.sites[0].id
					this.selectSite()
				}
			})
		}
		this.selectSite = ()=>{
			this.ga_site_id         = this.refs.site_id.value
			localStorage.ga_site_id = this.ga_site_id

			GA.getViews(this.refs.account_id.value, this.refs.site_id.value, views=>{
				this.views = views

				this.update()

				if (this.views.length==1) {
					this.refs.view_id.value = this.views[0].id
					this.selectView()
				}
			})
		}

		this.selectView = ()=>{
			this.ga_view_id         = this.refs.view_id.value
			localStorage.ga_view_id = this.ga_view_id

			for(let k in this.views){
				if (this.views[k].id==this.ga_view_id) {
					this.ga_view_name         = this.views[k].name
					localStorage.ga_view_name = this.ga_view_name
				}
			}
			this.renderChart()
			setTimeout(()=>{
				this.update()
			},2000)
		}

		this.renderChart = ()=>{
			if (!this.ga_view_id) {
				return
			}

			GA.getData(this.ga_view_id, stat=>{
				Charts.render(stat)
			})
		}

		this.changeAccount = ()=>{
			this.ga_view_id = false
			this.ga_site_id = false
			this.sites      = false
			this.views      = false
			this.update()
		}

	</script>
	<div class="stat-wrap">
		<div class={auth:true, show:need_auth}>
			<p>For see stats you need grant access </p>
			<section id="auth_button"></section>
		</div>

		<div if={auth} class="stat">
			<div if={ga_view_id} onclick={changeAccount} class="selected-account">
				<b>Account</b>: {ga_site_id} / {ga_view_name} <span>[Change]</span>
			</div>
			<div if={!ga_view_id} class="account-selector">
				<select if={accounts} ref="account_id" onchange={selectAccount}>
					<option value="">Select account</option>
					<option each={acc in accounts} value="{acc.id}">{acc.name}</option>
				</select>
				<select if={sites} ref="site_id" onchange={selectSite}>
					<option value="">Select site</option>
					<option each={site in sites} value="{site.id}">{site.name}</option>
				</select>
				<select if={views} ref="view_id" onchange={selectView}>
					<option value="">Select view</option>
					<option each={view in views} value="{view.id}">{view.name}</option>
				</select>
			</div>
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
			.selected-account, .account-selector {
				height: 70px;
				padding-left: 60px;
			}
			.selected-account {
				padding-left: 70px;
				cursor: pointer;
				text-transform: uppercase; letter-spacing:1px;
				font-weight: 300; font-size: 20px;

				color: #fff;
					opacity:0.6;

				b { font-weight:200; }

				span {
					opacity: 0.4;
					font-weight:200; font-size:14px;
					position:relative; top:-3px;
					text-transform:lowercase;
					margin-left: 10px;
				}

				&:hover {
					opacity:0.8;
					span { opacity:1; color:#fff; }
				}
			}
			.account-selector {
				select {
					margin: 5px;
					max-width: 30%;
				}
			}
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
