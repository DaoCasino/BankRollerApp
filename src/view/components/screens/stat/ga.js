/*
 * Wrap for google analytics API
 * docs: https://developers.google.com/analytics/devguides/config/mgmt/v3/quickstart/web-js
 **/
const gAppID = '700779122572-amttr8ulikte1fgbjogdvdfuios08p9s.apps.googleusercontent.com'

export default new class GA {
	constructor() {

	}

	init(callback){
		(function(w,d,s,g,js,fjs){
			g=w.gapi||(w.gapi={});g.analytics={q:[],ready:function(cb){this.q.push(cb)}}
			js=d.createElement(s);fjs=d.getElementsByTagName(s)[0]
			js.src='https://apis.google.com/js/platform.js'
			fjs.parentNode.insertBefore(js,fjs);js.onload=function(){g.load('analytics')}
		}(window,document,'script'))

		this.api = gapi
		gapi.analytics.ready(callback)
	}

	auth(button_container){
		gapi.analytics.auth.authorize({
			container: button_container,
			clientid:  gAppID,
		})
	}

	//
	//
	//
	//


	getAccounts(callback){
		gapi.client.analytics.management.accounts.list().then( r => {
			callback(r.result.items)
		})
	}

	getSites(accountId, callback){
		gapi.client.analytics.management.webproperties.list({'accountId': accountId}).then(r=>{
			callback(r.result.items)
		})
	}
	getViews(accountId, webPropertyId, callback){
		gapi.client.analytics.management.profiles.list({
			'accountId': accountId,
			'webPropertyId': webPropertyId
		}).then( r => {
			callback(r.result.items)
		})
	}

	getData(account_id, callback){
		let data = {}
		gapi.client.analytics.data.ga.get({
			'ids':        'ga:' + account_id,
			'start-date': '7daysAgo',
			'end-date':   'today',
			'dimensions': 'ga:date',
			'metrics':    'ga:visitors'
		}).then( response => {
			response.result.rows.forEach(item=>{
				data[item[0]] = +item[1]
			})
			callback(data)
		})
	}
}
