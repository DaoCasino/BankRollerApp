function ItemTooltip(prnt) {
	PIXI.Container.call( this );
	
	var _self = this;
	var bg;
	var tfDesc;
	
	_self.init = function() {
		var w = 250;
		var h = 100;
		bg = new PIXI.Graphics();
		bg.beginFill(0xED9829).drawRect(-w/2, -h/2, w, h).endFill();
		bg.alpha = 0.75;
		_self.addChild(bg);
		
		tfDesc = addText("", 30, "#FFFFFF", undefined, "center", w*0.9);
		tfDesc.x = 0;
		tfDesc.y = -tfDesc.height/2;
		_self.addChild(tfDesc);
		
		_self.w = w;
		_self.h = h;
	}
	
	_self.show = function(str) {
		tfDesc.setText(str);
		tfDesc.y = bg.y-tfDesc.height/2;
		bg.height = tfDesc.height + 10;
	}
	
	_self.init(prnt);
}

ItemTooltip.prototype = Object.create(PIXI.Container.prototype);
ItemTooltip.prototype.constructor = ItemTooltip;
