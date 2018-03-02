function ItemWS() {
	PIXI.Container.call( this );
	
	var _self = this;
	var _arWinSt = [0, 2, 4, 10, 20, 50];
	var _arProfit = [];
	var _arPosY = [];
	var _tfBet;
	var _curWSGR;
	
	_self.init = function() {
		var bg = addObj("bgWndWS1");
		_self.addChild(bg);
		
		var w = bg.w;
		var h = bg.h;
		_curWSGR = new PIXI.Graphics();
		_curWSGR.beginFill(0xED9829).drawRect(-w/2, 0, w, 40).endFill();
		_curWSGR.alpha = 0.7;
		_self.addChild(_curWSGR);
		_curWSGR.visible = false;
		
		var tfWinStr = addText(getText("win_streak"), 40, "#ED9829");
		tfWinStr.x = 0;
		tfWinStr.y = - h/2 + 30;
		_self.addChild(tfWinStr);
		_tfBet = addText(getText("your_bet")+": 0", 32, "#FFFFFF");
		_tfBet.x = 0;
		_tfBet.y = - h/2 + 100;
		_self.addChild(_tfBet);
		
		for (var i = 1; i < _arWinSt.length; i++) {
			var str = i + ". x" + _arWinSt[i];
			var tfX= addText(str, 30, "#FFFFFF", undefined, "left");
			tfX.x = -120;
			tfX.y = tfWinStr.y + i*45 + 100;
			_self.addChild(tfX);
			var tfProfit= addText("", 30, "#5AB63E", undefined, "left");
			tfProfit.x = 0;
			tfProfit.y = tfWinStr.y + i*45 + 100;
			_self.addChild(tfProfit);
			_arProfit.push(tfProfit);
			_arPosY.push(tfX.y);
		}
	}
	
	_self.setBet = function(bet) {
		_tfBet.setText(getText("your_bet")+": "+bet);
		_self.clear();
		for (var i = 0; i < _arProfit.length; i++) {
			var tf = _arProfit[i];
			var val = (bet * _arWinSt[i+1]).toFixed(2);
			tf.setText(val);
		}
	}
	
	_self.refreshWS = function(ws) {
		_curWSGR.visible = true;
		_curWSGR.y = _arPosY[ws-1] -5;
	}
	
	_self.clear = function(ws) {
		_curWSGR.visible = false;
	}
	
	_self.init();
}

ItemWS.prototype = Object.create(PIXI.Container.prototype);
ItemWS.prototype.constructor = ItemWS;
