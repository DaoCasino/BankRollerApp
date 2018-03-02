/**
 * Created by DAO.casino
 * Treasure Of DAO - WndInstruction
 * v 1.0.0
 */

var WndInstruction = function(prnt){
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
		var bg = addObj("bgWndInfo",0,0,2);
		_self.addChild(bg);
		
		_btnOk = addButton("btnOk", 0, 300, 0.75);
		_btnOk.overSc = true;
		_self.addChild(_btnOk);
		_self.arButtons.push(_btnOk);
		
		var tfTitle = addText(getText("instruction"), 50, "#ED9829", undefined, "center", 500)
		tfTitle.y = -330;
		_self.addChild(tfTitle);
		_tfDesc = addText("", 26, "#ED9829", undefined, "center", 500)
		_tfDesc.y = -120;
		_self.addChild(_tfDesc);
		
		var arIcons = [
			{name:"btnCashout", title:"cashout"}, 
			{name:"btnHistory", title:"history_game"}, 
			{name:"btnContract", title:"contract"}, 
			{name:"btnFullscreen", title:"fullscreen"}, 
			{name:"btnDao", title:"site"}
		];
		var xPos = 0;
		var yPos = 0;
		
		for (var i = 0; i < arIcons.length; i++) {
			_self.addIco(arIcons[i], xPos, yPos);
			xPos ++;
			if(xPos%2==0){
				xPos = 0;
				yPos ++;
			}
		}
	}
	
	_self.show = function(callback) {
		_callback = callback;
	}
	
	_self.addIco = function(obj, x, y) {
		var xStart = -400;
		var yStart = -120;
		var ico = addObj(obj.name, xStart+x*450, yStart+y*150, 1);
		_self.addChild(ico);
		
		var tfTitle = addText(getText(obj.title), 30, "#FFCC00", undefined, "left", 300)
		tfTitle.x = ico.x + ico.width/2 + 10;
		tfTitle.y = ico.y - ico.height/2 + 10;
		_self.addChild(tfTitle);
		var tfDesc = addText(getText("desc_"+obj.title), 26, "#FFFFFF", undefined, "left", 300)
		tfDesc.x = ico.x + ico.width/2 + 10;
		tfDesc.y = tfTitle.y + tfTitle.height/2 + 20;
		_self.addChild(tfDesc);
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

WndInstruction.prototype = new InterfaceObject();