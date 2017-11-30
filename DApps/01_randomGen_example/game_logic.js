/**
 * Define our DApp logic constructor, 
 * for use it in frontend and bankroller side
 */
DCLib.defineDAppLogic('01_randomGen_example', function() {
	return {roll:function(randomHash) {
		var rnd = DCLib.numFromHash(randomHash, 0, 1);
		if (rnd == 1) {
			return "You win";
		} else {
			return "You lose";
		}
	}};
});