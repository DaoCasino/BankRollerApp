import _config from 'app.config'
import Eth     from 'Eth/Eth'
import Stat    from 'stat'
import GA      from './ga'
import Charts  from './charts'

import './referer.less'

<referer>
	<script>
		this.auth         = false
		this.need_auth    = false
		this.ga_site_id   = false
		this.ga_view_id   = false
		this.ga_view_name = false
		this.links        = false

		this.on('mount',()=>{

			this.getBlockchainStat()

			if (localStorage.ga_view_id) {
				this.ga_site_id   = localStorage.ga_site_id
				this.ga_view_id   = localStorage.ga_view_id
				this.ga_view_name = localStorage.ga_view_name
			}

			if (GA.api && GA.api.analytics.auth && GA.api.analytics.auth.isAuthorized()) {
				this.loadData()
				return
			}

			if (window.ga_initied) {
				window.location.reload()
			}

			GA.init(()=>{
				window.ga_initied = true
				if (GA.api.analytics.auth && GA.api.analytics.auth.isAuthorized()) {
					this.loadData()
					return
				}

				GA.auth('auth_button')
				this.need_auth = true
				this.update()

				this.t = setInterval(()=>{
					if (!GA.api.analytics.auth) {
						clearInterval(this.t)
						return
					}

					if (GA.api.analytics.auth.isAuthorized()) {
						this.need_auth = false
						this.loadData()
					}
				},1000)
			})
		})

		this.getBlockchainStat = ()=>{
			clearTimeout( this.getBlockchainStatTimeout )
			this.getBlockchainStatTimeout = setTimeout(()=>{
				Stat.getReferralsCount( referrals => {
					this.referrals_cnt = ''+referrals
					this.update()
				})

				Stat.getProfit( profit => {
					this.profit = ''+profit
					this.update()
				})
			}, 2000)
		}

		this.loadData = ()=>{
			clearInterval(this.t)

			this.auth = true
			this.update()

			GA.getAccounts(accounts=>{
				this.accounts = accounts
				this.update()
			})

			this.renderChart()
			this.generateLinks()
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

		this.generateLinks = ()=>{
			if (!this.ga_site_id) {
				return
			}
			let addr = Eth.Wallet.get().openkey
			if (!addr) {
				return
			}

			this.links = []
			for(let k in _config.games){
				this.links.push({
					game: _config.games[k].name,
					href: _config.games[k].url+'?ref='+addr+'&gaid='+this.ga_site_id
				})
			}
			this.update()
		}

		this.copy = e => {
			App.view.copyToClipboard( e.target.value )
		}

	</script>
	<div class="stat-wrap">

		<div class="blockchain-stat">
			<span if={referrals_cnt} class="referrals_cnt">
				<em>{referrals_cnt}</em> refferals
			</span>

			<span if={profit} class="profit">
				<em>{profit}</em> BETS
			</span>
		</div>
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

		<div if={links} class="links">
			<h3>Your referral links</h3>
			<div each={link in links} class="link">
				<label>{link.game}</label>
				<input type="text" onclick={copy} value="{link.href}">
			</div>
		</div>
	</div>

	<style type="less">

	</style>
</referer>
