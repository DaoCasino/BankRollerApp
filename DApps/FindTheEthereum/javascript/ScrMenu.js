/**
 * Created by DAO.casino
 * Treasure Of DAO - Menu
 * v 1.0.0
 */

/*eslint no-undef: "none"*/

var ScrMenu = function(){
	PIXI.Container.call( this );
	
	var _self = this;
	var _btnStart;
	var _wndWarning, _wndInfo;
	
	// INIT
	_self.init = function(){
		_self.initData();
		
		var bg = addObj("bgMenu", _W/2, _H/2);
		scaleBack = _W/bg.w;
		bg.scale.x = scaleBack;
		bg.scale.y = scaleBack;
		_self.addChild(bg);
		var bgDark = addObj("bgDark", _W/2, _H/2);
		bgDark.scale.x = scaleBack;
		bgDark.scale.y = scaleBack;
		_self.addChild(bgDark);
		var tableLogo = addObj("tableLogoMenu");
		tableLogo.scale.x = scaleBack;
		tableLogo.scale.y = scaleBack;
		tableLogo.x = 1000*scaleBack;
		tableLogo.y = 546*scaleBack;
		_self.addChild(tableLogo);
		
		var titleGame = addObj("titleGame", 1550, 220);
		_self.addChild(titleGame);
		var pirateTitle = addObj("pirateTitle", 350, 600);
		_self.addChild(pirateTitle);
		
		_self.createGui();
	}
	
	_self.createGui = function() {
		var tfVersion = addText(version, 24, "#ffffff", "#000000", "right", 400, 4);
		tfVersion.x = _W - 30;
		tfVersion.y = _H - tfVersion.height - 10;
		_self.addChild(tfVersion);
		
		var logoDaoCasino = addObj("logoDaoCasino", 210, 1037);
		_self.addChild(logoDaoCasino);
		
		_btnStart = addButton("btnText", _W/2, 950);
		_btnStart.name = "btnStart"
		_btnStart.overSc = true;
		_self.addChild(_btnStart);
		_self.arButtons.push(_btnStart);
		var tfStart = addText(getText("start"), 50, "#FFFFFF", undefined, "center", 700);
		tfStart.x = 0;
		tfStart.y = -tfStart.height/2;
		_btnStart.addChild(tfStart);
		
		var btnDao = addButton("btnDao", 1836, 960);
		btnDao.overSc = true;
		_self.addChild(btnDao);
		_self.arButtons.push(btnDao);
		var btnFacebook = addButton("btnFacebook", 1870, 48);
		btnFacebook.overSc = true;
		_self.addChild(btnFacebook);
		_self.arButtons.push(btnFacebook);
		var btnTwitter = addButton("btnTwitter", 1870, 123);
		btnTwitter.overSc = true;
		_self.addChild(btnTwitter);
		_self.arButtons.push(btnTwitter);
	};
	
	_self.showWndWarning = function(str) {
		if(_wndWarning == undefined){
			_wndWarning = new PIXI.Container();
			_wndWarning.x = _W/2;
			_wndWarning.y = _H/2;
			_self.addChild(_wndWarning);
			
			var bg = addObj("bgWndWarning");
			_wndWarning.addChild(bg);
			var tfTitle = addText(getText("please_wait"), 40, "#FFCC00", "#000000", "center", 500, 3)
			tfTitle.y = - 90;
			_wndWarning.addChild(tfTitle);
			var tf = addText("", 26, "#FFFFFF", "#000000", "center", 500, 3)
			tf.y = - 30;
			_wndWarning.addChild(tf);
			
			var loading = new ItemLoading();
			loading.x = 0;
			loading.y = 60;
			_wndWarning.addChild(loading);
			
			_wndWarning.tf = tf;
			_wndWarning.loading = loading;
		}
		
		_wndWarning.tf.setText(str);
		_wndWarning.tf.y = -_wndWarning.tf.height/2;
		_wndWarning.visible = true;
	}
	
	_self.showTutor = function() {
		loginObj["tutor_intro"] = true;
		_btnStart.setDisabled(true);
		
		if(_wndInfo == undefined){
			_wndInfo = new WndInstruction(this);
			_wndInfo.x = _W/2;
			_wndInfo.y = _H/2;
			_self.addChild(_wndInfo);
		}
		
		_wndInfo.show(_self.clickStart)
		_wndInfo.visible = true;
		_curWindow = _wndInfo;
	}
	
	// CLOSE
	_self.closeWindow = function(wnd) {
		if(wnd){
			_curWindow = wnd;
		}
		if(_curWindow){
			_curWindow.visible = false;
			_curWindow = undefined;
		}
	}
	
	// CLICK
	_self.clickStart = function() {
		if(loginObj["tutor_intro"]){
			_self.removeAllListener();
			addScreen("ScrGame");
		}else{
			_self.showTutor();
		}
	};
	
	_self.clickTwitter = function() {
		// @daocasino @ethereumproject @edcon #blockchain #ethereum
		if(twttr){
			var urlGame = 'http://platform.dao.casino/';
			var url="https://twitter.com/intent/tweet";
			var str='Play "Find The Ethereum" for BET '+ " " + urlGame;
			var hashtags="blockchain,ethereum,daocasino";
			var via="daocasino";
			window.open(url+"?text="+str+";hashtags="+hashtags+";via="+via,"","width=500,height=300");
		}
	}

	_self.clickFB = function() {
		if (typeof(FB) != 'undefined' && FB != null ) {
			var urlGame = 'http://platform.dao.casino/';
			var urlImg = "http://platform.dao.casino/games/FindTheEthereum/images/bg/shareFB.jpg";
			
			FB.ui({
			  method: 'feed',
			  picture: urlImg,
			  link: urlGame,
			  caption: 'PLAY',
			  description: 'Play "Find The Ethereum" for BET',
			}, function(response){});
		} else {
			console.log("FB is not defined");
		}
	}
	
	_self.clickObj = function(item_mc) {
		if(item_mc._disabled){
			return;
		}
		if(item_mc.overSc){
			item_mc.scale.x = 1*item_mc.sc;
			item_mc.scale.y = 1*item_mc.sc;
		}
		
		item_mc._selected = false;
		if(item_mc.name == "btnStart"){
			_self.clickStart();
		} else if(item_mc.name == "btnDao"){
			_self.removeAllListener();
			// var url = "https://platform.dao.casino/";
			var url = "/";
			window.open(url, "_self");
		} else if(item_mc.name == "btnFacebook"){
			_self.clickFB();
		} else if(item_mc.name == "btnTwitter"){
			_self.clickTwitter();
		}
	};
	
	// UPDATE
	_self.update = function(diffTime) {
		if(options_pause){
			return;
		}
		
		if(_wndWarning){
			if(_wndWarning.visible){
				_wndWarning.loading.update(diffTime);
			}
		}
	};
	
	// REMOVE
	_self.removeAllListener = function() {
		clearClips();
		this.off("mouseup", this.touchHandler);
		this.off("mousedown", this.touchHandler);
		this.off("mousemove", this.touchHandler);
		this.off("touchstart", this.touchHandler);
		this.off("touchmove", this.touchHandler);
		this.off("touchend", this.touchHandler);
	};
	
	_self.init();
	
	return _self;
};

ScrMenu.prototype = new InterfaceObject();