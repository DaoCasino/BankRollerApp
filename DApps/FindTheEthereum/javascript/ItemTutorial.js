function ItemTutorial(prnt) {
	PIXI.Container.call( this );
	
	var _self = this;
	var itemDialog;
	var tfDesc;
	
	_self.init = function() {
		this.name = "ItemTutorial";
		
		var pirateHead = addObj("pirateTitle", 0, 0, 0.65, -1);
		this.addChild(pirateHead);
		itemDialog = addObj("itemDialog", -230, -180);
		this.addChild(itemDialog);
		tfDesc = addText("", 24, "#000000", undefined, "center", 300);
		tfDesc.x = itemDialog.x-30;
		tfDesc.y = itemDialog.y-tfDesc.height/2-2;
		this.addChild(tfDesc);
		
		this.w = pirateHead.w + itemDialog.w;
		this.h = pirateHead.h;
	}
	
	_self.show = function(str) {
		tfDesc.setText(str);
		tfDesc.y = itemDialog.y-tfDesc.height/2-2;
	}
	
	_self.init(prnt);
}

ItemTutorial.prototype = Object.create(PIXI.Container.prototype);
ItemTutorial.prototype.constructor = ItemTutorial;
