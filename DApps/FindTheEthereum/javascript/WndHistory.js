/**
 * Created by DAO.casino
 * Treasure Of DAO - WndHistory
 * v 1.0.0
 */

/*eslint no-undef: "none"*/

var WndHistory = function(prnt, deposit){
	PIXI.Container.call( this );
	
	var _self = this;
	var _btnOk, _thinLine, _headScroll;
	var _tfNum, _tfBet, _tfWS, _tfProfit, _tfBalance;
	var _hMask = 300;
	var _stY = -160;
	var _endY = 180;
	var _pressHead = false;
	
	// INIT
	_self.init = function(){
		_self.initData();
		
		var rect = new PIXI.Graphics();
		rect.beginFill(0x000000).drawRect(-_W/2, -_H/2, _W, _H).endFill();
		rect.alpha = 0.5;
		_self.addChild(rect);
		var bg = addObj("bgWndInfo", 0, 0, 1.5);
		_self.addChild(bg);
		
		var posLineX = 380;
		_thinLine = new PIXI.Graphics();
		_thinLine.lineStyle(2, 0xffffff)
		_thinLine.moveTo(posLineX, _stY)
			   .lineTo(posLineX, _endY);
		_self.addChild(_thinLine);
		var scrollZone = new PIXI.Container();
		_self.addChild(scrollZone);		
		var zone = new PIXI.Graphics();
		zone.beginFill(0xFF0000).drawRect(0, 0, 50, _endY-_stY).endFill();
		zone.x = -zone.width/2;
		zone.y = -zone.height/2;
		scrollZone.addChild(zone);
		scrollZone.w = 50;
		scrollZone.h = _endY-_stY;
		scrollZone.x = posLineX;
		scrollZone.y = _stY+scrollZone.h/2;
		scrollZone.name = "scrollZone";
		scrollZone.visible = false;
		scrollZone._selected = false;
		_self.arButtons.push(scrollZone);
		
		_btnOk = addButton("btnOk", 0, 220, 0.75);
		_btnOk.overSc = true;
		_self.addChild(_btnOk);
		_self.arButtons.push(_btnOk);
		_headScroll = addObj("headScroll", posLineX, _stY);
		_headScroll._selected = false;
		_headScroll._disabled = false;
		_headScroll.interactive = true;
		_headScroll.buttonMode=true;
		_self.addChild(_headScroll);
		_self.arButtons.push(_headScroll);
		
		var tfWin = addText(getText("history_game"), 40, "#ED9829", undefined, "center", 500, 3)
		tfWin.y = -250;
		_self.addChild(tfWin);
		
		var offsetX = 150;
		var tfNum = addText(getText("num"), 30, "#FFCC00", undefined, "left", 400)
		tfNum.x = -380;
		tfNum.y = -180;
		_self.addChild(tfNum);
		var tfBet = addText(getText("bet"), 30, "#FFCC00", undefined, "left", 400)
		tfBet.x = tfNum.x + offsetX;
		tfBet.y = tfNum.y;
		_self.addChild(tfBet);
		var tfWS = addText(getText("ws"), 30, "#FFCC00", undefined, "left", 400)
		tfWS.x = tfNum.x + offsetX*2;
		tfWS.y = tfNum.y;
		_self.addChild(tfWS);
		var tfProfit = addText(getText("profit"), 30, "#FFCC00", undefined, "left", 400)
		tfProfit.x = tfNum.x  + offsetX*3;
		tfProfit.y = tfNum.y;
		_self.addChild(tfProfit);
		var tfBalance = addText(getText("balance"), 30, "#FFCC00", undefined, "left", 400)
		tfBalance.x = tfNum.x  + offsetX*4;
		tfBalance.y = tfNum.y;
		_self.addChild(tfBalance);
		
		_tfNum = addText("", 30, "#FFFFFF", undefined, "left", 400)
		_tfNum.x = tfNum.x;
		_tfNum.y = tfNum.y + 50;
		_self.addChild(_tfNum);
		_tfBet = addText("", 30, "#FFFFFF", undefined, "left", 400)
		_tfBet.x = tfBet.x;
		_tfBet.y = tfBet.y + 50;
		_self.addChild(_tfBet);
		_tfWS = addText("", 30, "#FFFFFF", undefined, "left", 400)
		_tfWS.x = tfWS.x;
		_tfWS.y = tfWS.y + 50;
		_self.addChild(_tfWS);
		_tfProfit = addText("", 30, "#FFFFFF", undefined, "left", 400)
		_tfProfit.x = tfProfit.x;
		_tfProfit.y = tfProfit.y + 50;
		_self.addChild(_tfProfit);
		_tfBalance = addText("", 30, "#FFFFFF", undefined, "left", 400)
		_tfBalance.x = tfBalance.x;
		_tfBalance.y = tfBalance.y + 50;
		_self.addChild(_tfBalance);
		
		var zoneMask = new PIXI.Graphics();
		zoneMask.beginFill(0xFF0000).drawRect(0, 0, 730, _hMask).endFill();
		zoneMask.x = -25-zoneMask.width/2;
		zoneMask.y = 20-zoneMask.height/2;
		_self.addChild(zoneMask);
		
		_tfNum.mask = zoneMask;
		_tfBet.mask = zoneMask;
		_tfWS.mask = zoneMask;
		_tfProfit.mask = zoneMask;
		_tfBalance.mask = zoneMask;
	}
	
	_self.show = function(array) {
		_thinLine.visible = false;
		_headScroll.visible = false;
		
		if(array){
			if(array.length == 0){
				return;
			}
			
			var strNum = "";
			var strBet = "";
			var strWS = "";
			var stProfit = "";
			var strBalance = "";
			
			for (var i = 0; i < array.length; i++) {
				var obj = array[i];
				
				for(var tag in obj){
					var value = obj[tag];
					if(tag == "betGame"){
						strBet += value;
					} else if(tag == "countWinStr"){
						strWS += value;
					} else if(tag == "profit"){
						stProfit += value.toFixed(2);
					} else if(tag == "balance"){
						if(options_debug){
							value = (deposit + value).toFixed(2);
						}
						if(options_arcade){
							value = value.toFixed(2);
						}
						strBalance += value;
					}
				}
				
				strNum += String(i+1) + "\n";
				strBet += "\n";
				strWS += "\n";
				stProfit += "\n";
				strBalance += "\n";
			}
			
			_tfNum.setText(strNum);
			_tfBet.setText(strBet);
			_tfWS.setText(strWS);
			_tfProfit.setText(stProfit);
			_tfBalance.setText(strBalance);
		}
		
		if(_tfNum.height + 20 > _hMask){
			_thinLine.visible = true;
			_headScroll.visible = true;
		}
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
		} else if(name == "scrollZone"){
			_self.mouseBtn(evt);
		}
	}
	
	_self.mouseBtn = function(evt){
		var mouseY = evt.data.global.y - _self.y;
		_self.scrollHead(mouseY);
	}
	
	_self.scrollHead = function(mouseY){
		var posY = Math.max(mouseY, _stY);
		posY = Math.min(posY, _endY);
		_headScroll.y = posY;
		
		if(_tfNum.height > _hMask){
			var difH = _tfNum.height - _hMask;
			var sc = (posY + Math.abs(_stY))/340;
			var textY = -130 - difH*sc;
			_tfNum.y = textY;
			_tfBet.y = textY;
			_tfWS.y = textY;
			_tfProfit.y = textY;
			_tfBalance.y = textY;
		}
	}
	
	_self.checkButtons = function(evt){
		var phase = evt.type; 
		var mouseX = evt.data.global.x - this.x
		var mouseY = evt.data.global.y - this.y;
		for (var i = 0; i < _self.arButtons.length; i++) {
			var item_mc = _self.arButtons[i];
			if(hit_test_rec(item_mc, item_mc.w, item_mc.h, mouseX, mouseY)){
				if((item_mc.visible || item_mc.name == "scrollZone") && 
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
		
		if((phase=='touchstart' || phase == 'mousedown') && _headScroll._selected){
			_pressHead = true;
		}
	}

	_self.touchHandler = function(evt){	
		if(!_self.visible){
			return false;
		}
		// mousedown , mousemove
		// touchstart, touchmove, touchend
		var phase = evt.type; 
		var item_mc; //MovieClip
		var i = 0;
		
		if(phase=='mousemove' || phase == 'touchmove' || 
		phase == 'touchstart' || phase == 'mousedown'){
			if(_pressHead){
				_self.mouseBtn(evt);
				return;
			}
			this.checkButtons(evt);
		} else if (phase == 'mouseup' || phase == 'touchend') {
			_pressHead = false;
			for (i = 0; i < _self.arButtons.length; i ++) {
				item_mc = _self.arButtons[i];
				if((item_mc.visible || item_mc.name == "scrollZone") && item_mc._selected){
					this.clickObj(item_mc, evt);
					return;
				}
			}
		}
	}

	_self.init();
	
	return _self;
};

WndHistory.prototype = new InterfaceObject();