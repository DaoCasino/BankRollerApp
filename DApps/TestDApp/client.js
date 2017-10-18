const myDAppLogic = function(){
	var nologic = ':)'

	return {
		nothing: true
	}
}


window.MyDApp = new DCLib.DApp({
	code  : 'GAME_CODE',
	logic : myDAppLogic,
})


console.log('Use console to see what inside MyDApp object')
console.log('MyDApp', MyDApp)


