/**
 * Define our DApp logic constructor, 
 * for use it in frontend and bankroller side
 */
DCLib.defineDAppLogic('multy_v2', function(){
	const _self = this

	return {
		roll    : Roll,
		history : history,
	}
})