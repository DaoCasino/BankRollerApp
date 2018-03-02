/**
 * Created by DAO.casino
 * Treasure Of DAO - WndDeposit
 * v 1.0.0
 */

/*eslint no-undef: "none"*/

var WndDeposit = function(prnt, style){
	PIXI.Container.call( this );
	
	var _self = this;
	var _callback;
	var _arButtons = [];
	var _maxBet = 0;
	var _curBet = 0;
	var _stX = -248;
	var _endX = 248;
	var _fatLine;
	var _btnOk, _headScroll;
	var _tfDesc, _tfBet;
	var _pressHead = false;
	
	if(style == undefined){
		style = {bg:"bgWndDeposit",
			colorDesc:"#ED9829"};
	}
	
	// INIT
	_self.init = function(){
		_self.initData();
		
		var w = 600;
		var h = 400;
		var rect = new PIXI.Graphics();
		rect.beginFill(0x000000).drawRect(-_W/2, -_H/2, _W, _H).endFill();
		rect.alpha = 0.5;
		_self.addChild(rect);
		var bg = addObj(style.bg);
		_self.addChild(bg);
		var posLineY = 50;
		var thinLine = addObj("lineScrollM", 0, posLineY);
		_self.addChild(thinLine);
		var fatLine = addObj("lineScrollB", 0, posLineY);
		_self.addChild(fatLine);
		
		_fatLine = new PIXI.Graphics();
		_fatLine.lineStyle(20, 0xFFFF57)
		_fatLine.moveTo(_stX, posLineY)
			   .lineTo(_endX, posLineY);
		_self.addChild(_fatLine);
		_fatLine.scale.x = 0;
		fatLine.mask = _fatLine;
		
		var scrollZone = new PIXI.Container();
		_self.addChild(scrollZone);
		var zone = new PIXI.Graphics();
		zone.beginFill(0xFF0000).drawRect(0, 0, _endX-_stX, posLineY).endFill();
		zone.x = -zone.width/2;
		zone.y = -zone.height/2;
		scrollZone.addChild(zone);
		scrollZone.y = posLineY;
		scrollZone.w = _endX-_stX;
		scrollZone.h = posLineY;
		scrollZone.name = "scrollZone";
		scrollZone.visible = false;
		scrollZone._selected = false;
		_arButtons.push(scrollZone);
		
		_btnOk = addButton("btnOk", 0, 140, 0.75);
		_btnOk.overSc = true;
		_btnOk.setDisabled(true);
		_self.addChild(_btnOk);
		_arButtons.push(_btnOk);
		_headScroll = addObj("headScroll", _stX, posLineY);
		_headScroll._selected = false;
		_headScroll._disabled = false;
		_headScroll.interactive = true;
		_headScroll.buttonMode=true;
		_self.addChild(_headScroll);
		_arButtons.push(_headScroll);
		
		_tfDesc = addText("", 26, style.colorDesc, undefined, "center", 500, 3)
		_tfDesc.y = -125;
		_self.addChild(_tfDesc);
		_tfBet = addText("0.00 BET", 40, "#FFFFFF", undefined, "center", 350, 4)
		_tfBet.y = -5- _tfBet.height/2;
		_self.addChild(_tfBet);
	}
	
	_self.show = function(str, callback, maxBet) {
		_callback = callback;
		_tfDesc.setText(str);
		_maxBet = maxBet;
		if(_curBet == 0){
			_curBet = Number((_maxBet/10).toFixed(2)) || 0.01;
		}
		var posX = _stX + (_curBet/_maxBet)*_endX*2;
		_headScroll.x = posX;
		var sc = (posX + _endX)/(_endX*2);
		_fatLine.x = _stX + _endX*sc;
		_fatLine.scale.x = sc;
		
		if(_curBet > _maxBet){
			_curBet = _maxBet.toFixed(2);
			_headScroll.x = _endX;
			_fatLine.x = 0;
			_fatLine.scale.x = 1;
		}
		
		_tfBet.setText(String(_curBet) + " BET");
		if(posX > _stX && _curBet >= 0.01){
			_btnOk.setDisabled(false);
		}
	}
	
	_self.roundBet = function(a){
		var b = a % 5;
		b && (a = a - b);
		return (a/100).toFixed(2)
	}

	_self.clickObj = function(item_mc, evt) {
		var name = item_mc.name
		item_mc._selected = false;
		if(item_mc.over){
			item_mc.over.visible = false;
		}
		if(item_mc.overSc){
			item_mc.scale.x = 1*item_mc.sc;
			item_mc.scale.y = 1*item_mc.sc;
		}
		
		if(name == "btnOk"){
			prnt.closeWindow(_self);
			if(_callback){
				_callback(_curBet);
			}
		} else if(name == "scrollZone"){
			_self.scrollHead(evt);
		}
	}
	
	_self.scrollHead = function(evt){
		var mouseX = evt.data.global.x - this.x;
		var posX = Math.max(mouseX, _stX);
		posX = Math.min(posX, _endX);
		_headScroll.x = posX;
		
		var sc = (posX + _endX)/(_endX*2);
		_fatLine.x = _stX + _endX*sc;
		_fatLine.scale.x = sc;
		
		var minBet = 0;
		_curBet = (sc*_maxBet).toFixed(2);
		var value = _curBet;
		// value = _self.roundBet(value*100)
		_curBet = value;
		_tfBet.setText(String(value) + " BET");
		
		if(posX > _stX && value >= 0.01){
			_btnOk.setDisabled(false);
		} else {
			_btnOk.setDisabled(true);
		}
	}

	_self.checkButtons = function(evt){
		var phase = evt.type; 
		var mouseX = evt.data.global.x - _self.x
		var mouseY = evt.data.global.y - _self.y;
		for (var i = 0; i < _arButtons.length; i++) {
			var item_mc = _arButtons[i];
			if(hit_test_rec(item_mc, item_mc.w, item_mc.h, mouseX, mouseY)){
				if((item_mc.visible || item_mc.name == "scrollZone") && 
				item_mc._selected == false && !item_mc._disabled){
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
		
		if((phase=='touchstart' || phase == 'mousedown') && _headScroll._selected){
			_pressHead = true;
		}
	}
	
	_self.touchHandler = function(evt){	
		if(!_self.visible){
			return false;
		}
		// mousedown , mousemove, mouseup
		// touchstart, touchmove, touchend
		var phase = evt.type; 
		var item_mc; //MovieClip
		var i = 0;
		
		if(phase=='mousemove' || phase == 'touchmove' || 
		phase == 'touchstart' || phase == 'mousedown'){
			if(_pressHead){
				_self.scrollHead(evt);
				return;
			}
			_self.checkButtons(evt);
		} else if (phase == 'mouseup' || phase == 'touchend') {
			_pressHead = false;
			for (i = 0; i < _arButtons.length; i ++) {
				item_mc = _arButtons[i];
				if((item_mc.visible || item_mc.name == "scrollZone") && item_mc._selected){
					_self.clickObj(item_mc, evt);
					return;
				}
			}
		}
	}
	
	_self.init();
	
	return _self;
};

WndDeposit.prototype = new InterfaceObject();