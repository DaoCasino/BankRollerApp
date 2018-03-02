/**
 * Created by DAO.casino
 * Treasure Of DAO - InterfaceObject
 * v 1.0.0
 */

var InterfaceObject = function(){
	PIXI.Container.call( this );
	
	this.arButtons = [];
	
	// INIT
	this.initData = function(){	
		this.interactive = true;
		this.on('mousedown', this.touchHandler);
		this.on('mousemove', this.touchHandler);
		this.on('mouseup', this.touchHandler);
		this.on('touchstart', this.touchHandler);
		this.on('touchmove', this.touchHandler);
		this.on('touchend', this.touchHandler);
	}
	
	this.clickObj = function(item_mc) {
		if(item_mc._disabled){
			return;
		}
		item_mc._selected = false;
		if(item_mc.over){
			item_mc.over.visible = false;
		}
		if(item_mc.overSc){
			item_mc.scale.x = 1*item_mc.sc;
			item_mc.scale.y = 1*item_mc.sc;
		}
	}
	
	this.checkButtons = function(evt){
		var phase = evt.type; 
		var mouseX = evt.data.global.x - this.x
		var mouseY = evt.data.global.y - this.y;
		for (var i = 0; i < this.arButtons.length; i++) {
			var item_mc = this.arButtons[i];
			if(hit_test_rec(item_mc, item_mc.w, item_mc.h, mouseX, mouseY)){
				if(item_mc.visible && 
				item_mc._selected == false && 
				!item_mc._disabled){
					item_mc._selected = true;
					if(item_mc.over){
						item_mc.over.visible = true;
					} else if(item_mc.overSc){
						item_mc.scale.x = 1.1*item_mc.sc;
						item_mc.scale.y = 1.1*item_mc.sc;
					}
				}
			} else {
				if(item_mc._selected){
					item_mc._selected = false;
					if(item_mc.over){
						item_mc.over.visible = false;
					} else if(item_mc.overSc){
						item_mc.scale.x = 1*item_mc.sc;
						item_mc.scale.y = 1*item_mc.sc;
					}
				}
			}
		}
	}
	
	this.touchHandler = function(evt){	
		if(!this.visible){
			return false;
		}
		// mousedown , mousemove, mouseup
		// touchstart, touchmove, touchend
		var phase = evt.type; 
		var item_mc; //MovieClip
		var i = 0;
		
		if(phase=='mousemove' || phase == 'touchmove' || 
		phase == 'touchstart' || phase == 'mousedown'){
			this.checkButtons(evt);
		} else if (phase == 'mouseup' || phase == 'touchend') {
			for (i = 0; i < this.arButtons.length; i ++) {
				item_mc = this.arButtons[i];
				if(item_mc.visible&& item_mc._selected){
					this.clickObj(item_mc);
					return;
				}
			}
		}
	}
	
	this.removeAllListener = function() {
		this.interactive = false;
		this.off('mousedown', this.touchHandler);
		this.off('mousemove', this.touchHandler);
		this.off('mouseup', this.touchHandler);
		this.off('touchstart', this.touchHandler);
		this.off('touchmove', this.touchHandler);
		this.off('touchend', this.touchHandler);
	}
	
	return this;
};

InterfaceObject.prototype = Object.create(PIXI.Container.prototype);
InterfaceObject.prototype.constructor = InterfaceObject;