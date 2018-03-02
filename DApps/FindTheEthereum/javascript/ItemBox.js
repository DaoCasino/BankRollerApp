function ItemBox(prnt, name) {
	PIXI.Container.call( this );
	
	var _self = this;
	var tfVal;
	var _boxLock, _boxGold, _boxEmpty, _boxSelected, _boxOver;
	
	_self.init = function(prnt) {
		this._prnt = prnt;
		this.name = "ItemBox";
		this._selected = false;
		this._disabled = false;
		
		var sc = 0.75;
		var posX = 0;
		var posY = -11;
		var lightX = 0;
		var lightY = -50;
		this.w = 261*sc;
		this.h = 185*sc;
		
		if(name == "L"){
			posX = -91;
			posY = -25;
			lightX = 15;
			lightY = -110;
			this.w = 325*sc;
			this.h = 249*sc;
		} else if(name == "R"){
			posX = 76;
			posY = -23;
			lightX = -15;
			lightY = -110;
			this.w = 325*sc;
			this.h = 249*sc;
		}
		poxOverX = posX+0.75;
		poxOverY = posY;
		poxEmptyX = posX;
		poxEmptyY = posY;
		poxGoldX = posX;
		poxGoldY = posY;
		
		_boxLock = addObj("boxLock"+name, posX*sc, posY*sc, sc);
		this.addChild(_boxLock);
		_boxOver = addObj("boxOver"+name, poxOverX*sc, poxOverY*sc, sc);
		this.addChild(_boxOver);
		_boxGold = addObj("boxGold"+name, poxGoldX*sc, poxGoldY*sc, sc);
		this.addChild(_boxGold);
		_boxEmpty = addObj("boxEmpty"+name, poxEmptyX*sc, poxEmptyY*sc, sc);
		this.addChild(_boxEmpty);
		_boxSelected = addObj("light"+name, lightX, lightY);
		this.addChild(_boxSelected);
		
		_self.refresh();
		_self.setDisabled(false);
		_self.main = _boxLock;
		_self.over = _boxOver;
	}
	
	_self.setDisabled = function(value) {
		_self._disabled = value;
		_self.buttonMode = !value;
		_self.interactive = !value;
	}
	
	_self.setSelected = function(value) {
		_boxSelected.visible = value;
	}
	
	_self.openBox = function(value) {
		_boxLock.visible = false;
		if(value){
			_boxGold.visible = true;
		} else {
			_boxEmpty.visible = true;
		}
	}
	
	_self.refresh = function() {
		_self.setDisabled(false);
		_boxLock.visible = true;
		_boxGold.visible = false;
		_boxEmpty.visible = false;
		_boxOver.visible = false;
		_boxSelected.visible = false;
	}
	
	_self.init(prnt);
}

ItemBox.prototype = Object.create(PIXI.Container.prototype);
ItemBox.prototype.constructor = ItemBox;
