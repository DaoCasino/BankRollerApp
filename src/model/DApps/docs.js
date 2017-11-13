export default function(DCLib){
	console.clear()
	console.log('\n')
	console.log('%c DCLib (DApps API) v 2.0 - initialized', 'background:#333; color:#d99736; padding:5px 10px; ')
	console.log('\n')
	console.groupCollapsed(' >>> README <<< ')
	
	console.log('\n')
	console.info('%c Full documentation here https://daocasino.readme.io/',
		 'background: #333; color: #bada55; padding:5px')

	console.info('\n\nUse DCLib like this:\n')
	console.info('%c' +
		'  const myDApp = new DCLib.DApp({})          \n'+
		'  console.log( DCLib.web3.version           )\n'+
		'  console.log( DCLib.Account.get().openkey  )\n'+
		'  console.log( DCLib.Utils                  )'
		,
	'font-size:12px; background:#ccc; color:#333;' 
	)
	console.log('\n')
	

	console.group('WEB3')
	console.log('web3 placed in DCLib.web3, vesrion:', DCLib.web3.version )
	console.log('docs: £https://github.com/ethereum/web3.js/tree/1.0')
	console.groupEnd()
	


	console.group('Account')
	
	console.group('Eth Account/Wallet')
	console.log('Account info DCLib().Account.get():')
	let accinfo = DCLib.Account.get()
	delete(accinfo._)
	console.table( accinfo )
	console.groupEnd()

	console.groupEnd()



	console.log('')
	console.log('')
	console.log('')
	console.groupEnd()
	console.log('\n')
	console.log('\n')
}