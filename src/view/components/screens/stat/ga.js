const ga_accountId     = 92023514
const ga_webPropertyId = 'UA-92023514-2'
const gAppID           = '700779122572-amttr8ulikte1fgbjogdvdfuios08p9s.apps.googleusercontent.com'

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
	// https://developers.google.com/analytics/devguides/config/mgmt/v3/quickstart/web-js
	//
	//


	// getAccount(){
	// 	gapi.client.analytics.management.webproperties.list({'accountId': 92023514})
	// 	.then((r)=>{
	// 		if (!r || !r.result || !r.result.items) {
	// 			return
	// 		}

	// 		for(let k in r.result.items){
	// 			if (r.result.items[k]=='UA-92023514-2') {

	// 			}
	// 		}
	// 	})
	// }

	getData(callback){
		let data = {}
		gapi.client.analytics.management.profiles.list({
			'accountId':     ga_accountId,
			'webPropertyId': ga_webPropertyId
		}).then((r)=>{
			let account = r.result.items[0]

			gapi.client.analytics.data.ga.get({
				'ids':        'ga:' + account.id,
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
		})




	}
}
