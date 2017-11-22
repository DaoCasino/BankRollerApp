/**
 * Define our DApp logic constructor, 
 * for use it in frontend and bankroller side
 */
DCLib.defineDAppLogic('bitcoiner', function(){
	const _self = this
	regs = [{
		user:0x1,
		amount:1
	}];
	
	payouts = [];
	return {
		ping:function(){return "pong"},
		register:function(address){

			var summ = regs[regs.length-1].amount; 
			
			var tmp=payouts[address]||0;
			payouts[address]=0;	
			_self.payChannel.addTX((summ*2-tmp)*-1);
					
			payouts[regs[regs.length-1].user] = summ+(payouts[regs[regs.length-1].user]||0); 
			
			regs.push({
				user:address,
				amount:summ*2
			})

			return summ*2;
		},
		getpayout:function(address){
			var tmp=payouts[address];
			_self.payChannel.addTX(tmp);
		}
		
	}
});