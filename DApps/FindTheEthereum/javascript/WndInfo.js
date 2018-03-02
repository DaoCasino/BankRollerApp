/**
 * Created by DAO.casino
 * Treasure Of DAO - WndInfo
 * v 1.0.0
 */

var WndInfo = function(prnt){
	PIXI.Container.call( this );
	
	var _self = this;
	var _callback;
	var _btnOk;
	var _tfDesc;
	
	// INIT
	_self.init = function(){
		_self.initData();
		
		var w = 600;
		var h = 400;
		var rect = new PIXI.Graphics();
		rect.beginFill(0x000000).drawRect(-_W/2, -_H/2, _W, _H).endFill();
		rect.alpha = 0.5;
		_self.addChild(rect);
		var bg = addObj("bgWndInfo");
		_self.addChild(bg);
		
		_btnOk = addButton("btnOk", 0, 150, 0.75);
		_btnOk.overSc = true;
		_self.addChild(_btnOk);
		_self.arButtons.push(_btnOk);
		
		_tfDesc = addText("", 26, "#ED9829", undefined, "center", 500)
		_tfDesc.y = -120;
		_self.addChild(_tfDesc);
	}
	
	_self.show = function(str, callback) {
		_callback = callback;
		_tfDesc.setText(str);
	}
	
	_self.clickObj = function(item_mc) {
		var name = item_mc.name
		item_mc._selected = false;
		if(item_mc.over){
			item_mc.over.visible = false;
		}
		if(item_mc.overSc){
			item_mc.scale.x = 1*item_mc.sc;
			item_mc.scale.y = 1*item_mc.sc;
		}
		
		prnt.closeWindow(_self);
		if(_callback){
			_callback();
		}
	}
	
	_self.init();
	
	return _self;
};

WndInfo.prototype = new InterfaceObject();