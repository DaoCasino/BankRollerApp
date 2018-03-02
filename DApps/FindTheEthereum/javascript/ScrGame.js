/**
 * Created by DAO.casino
 * Treasure Of DAO - Game
 * v 1.0.0
 */

/*eslint no-undef: "none"*/

// var hash = "0x146eb29e721c774c602023c40af0e9f174eebfffc61228270ec78f25ecdca575";
// var sign = DCLib.Account.sign(hash);
// DCLib.sigRecover(hash, sign.signature);

// var hash = DCLib.web3.utils.soliditySha3(1);
// var sig = DCLib.Account.signHash(hash)
// DCLib.web3.eth.accounts.recover(hash, sig)

var ScrGame = function(){
	PIXI.Container.call( this );
	
	const TIME_ONLINE = 5000;
	const TIME_BLOCK = 30000;
	const TIME_RESPONSE = 300000;
	const TIME_SEARCH_BANKROLLER = 5000;
	const COUNT_BANKR_OFFLINE = 15;
	
	var _self = this;
	var _objGame, _objTutor, _contract, _objDispute,
	_objCurSessionChannel, _objNextSessionChannel, _objCurSessionGame,
	_logic;
	var _curWindow, _itemBet, _bgDark, _itemTutorial, _tooltip;
	var _tfBalance, _tfBet, _tfWinStr, _tfAddress, _tfTime, _tfBlockchain;
	var _fRequestFullScreen, _fCancelFullScreen, _fCheckBankroller;
	// layers
	var back_mc, game_mc, face_mc, wnd_mc, warning_mc, tutor_mc, tooltip_mc;
	// buttons
	var _btnStart, _btnClose, _btnStart, _pirateContinue, _pirateSave, 
	_btnCashout, _btnSave, _btnContract;
	// windows
	var _wndDeposit, _wndBet, _wndWarning, _wndInfo, _wndWS, _wndWin, _wndHistory, _wndInstruction;
	// boolean
	var _gameOver, _bWindow, _bCloseChannel, _bOpenChannel, _bSendDispute,
	_bOfflineBankroll, _bUpdateGame, _bCloseDispute, _bReconnectBankroll;
	// numbers
	var _idTutor, _idBox,
	_betGame, _balanceBet, _balanceSession, _balanceGame, _balanceEth,
	_timeCloseWnd, _depositPlayer, _depositBankroll, _signSession, 
	_timeOnline, _timeBlock, _timeResponse, _timePhrase, _timeSearchBankroller,
	_offlineBanroller, _curBlock, _disputeBlock, _endBlock;
	// arrays
	var _arBoxes;
	// strings
	var _openkey, _addressBankroll, _idChannel, _idRoom, _disputeSeed;
	
	// INIT
	_self.init = function(){
		_self.initData();
		
		var bg = addObj("bgGame", _W/2, _H/2);
		scaleBack = _W/bg.w;
		bg.scale.x = scaleBack;
		bg.scale.y = scaleBack;
		_self.addChild(bg);
		var tableLogo = addObj("tableLogo");
		tableLogo.scale.x = scaleBack;
		tableLogo.scale.y = scaleBack;
		tableLogo.x = 952*scaleBack;
		tableLogo.y = 546*scaleBack;
		_self.addChild(tableLogo);
		
		_self.createLayers();
		_self.createBooleans();
		_self.createNumbers();
		_self.createArrays();
		_self.createStrings();
		_self.createObjects();
		// _self.loadGame();
		_self.createGui();
		_self.createBtn();
		_self.refreshData();
	};
	
	// SAVE/LOAD GAME
	_self.saveGame = function(){
		if(options_debug){
			return;
		}
		
		loginObj["addressContract"] = addressContract;
		loginObj["balanceSession"] = _balanceSession;
		loginObj["balanceGame"] = _balanceGame;
		loginObj["depositPlayer"] = _depositPlayer;
		loginObj["addressBankroll"] = _addressBankroll;
		loginObj["idChannel"] = _idChannel;
		loginObj["objGame"] = _objGame;
		loginObj["objCurSession"] = _objCurSessionChannel;
		loginObj["objNextSession"] = _objNextSessionChannel;
		loginObj["gameOver"] = _gameOver;
		loginObj["openChannel"] = _bOpenChannel;
		loginObj["room"] = _idRoom; 
		loginObj["history"] = App.logic.getHistory();
		loginObj["session"] = App.logic.session();
		loginObj["timeActive"] = getTimer();
		
		saveData();
	}
	
	_self.loadGame = function(){		
		if(loginObj["openChannel"]){
			addressContract = loginObj["addressContract"];
			_balanceSession = loginObj["balanceSession"];
			_balanceGame = loginObj["balanceGame"];
			_depositPlayer = loginObj["depositPlayer"];
			_addressBankroll = loginObj["addressBankroll"];
			_idChannel = loginObj["idChannel"];
			_objGame = loginObj["objGame"];
			_objCurSessionChannel = loginObj["objCurSession"];
			_objNextSessionChannel = loginObj["objNextSession"];
			_bOpenChannel = loginObj["openChannel"];
			_idRoom = loginObj["room"]; 
			_gameOver = loginObj["gameOver"];
			console.log("loadData:", _objGame);
			
			App.logic.initGame(_openkey, _addressBankroll);
			App.logic.loadGame(_objGame, loginObj["history"], loginObj["session"]);
		}
	}
	
	// CREATE
	_self.createLayers = function(){
		back_mc = new PIXI.Container();
		game_mc = new PIXI.Container();
		face_mc = new PIXI.Container();
		warning_mc = new PIXI.Container();
		wnd_mc = new PIXI.Container();
		tutor_mc = new PIXI.Container();
		tooltip_mc = new PIXI.Container();
		
		_self.addChild(game_mc);
		_self.addChild(back_mc);
		_self.addChild(face_mc);
		_self.addChild(warning_mc);
		_self.addChild(wnd_mc);
		_self.addChild(tutor_mc);
		_self.addChild(tooltip_mc);
	}
	
	_self.createBooleans = function(){
		_gameOver = true;
		_bWindow = false;
		_bCloseChannel = false;
		_bOpenChannel = false;
		_bSendDispute = false;
		_bOfflineBankroll = false;
		_bUpdateGame = false;
		_bCloseDispute = false;
	}
	
	_self.createNumbers = function(){
		_idTutor = 0;
		_idBox = 0;
		_betGame = 1;
		_balanceBet = 0;
		_balanceEth = 0;
		_balanceSession = 0;
		_timeCloseWnd = 0;
		_timeOnline = 0;
		_timeBlock = 0;
		_depositBankroll = 0;
		_signSession = 0;
		_offlineBanroller = 0;
		_curBlock = 0;
		_disputeBlock = 0;
		_endBlock = 0;
		_timeResponse = 0;
		_timePhrase = 0;
	}
	
	_self.createArrays = function(){
		_self.arButtons = [];
		_arBoxes = [];
	}
	
	_self.createStrings = function(){
		_openkey = DCLib.Account.get().openkey;
		_idRoom = '';
	}
	
	_self.createObjects = function () {
		_objCurSessionChannel = {
			session: 0,
			winstrict: 0,
			player_balance: 0,
			bankroller_balance: 0,
			signPlayer: "",
			signBankroll: ""
		}
		_objNextSessionChannel = {
			session: 0,
			winstrict: 0,
			player_balance: 0,
			bankroller_balance: 0,
			signPlayer: "",
			signBankroll: ""
		}
		_objCurSessionGame = {
			session: 0,
			round: 0,
			seed: "",
			game_data: [],
			sig_player: "",
			sig_bankroll: ""
		}
		_objDispute = {
			action:"",
			params:{},
			time:0,
		}
	}
	
	_self.createGui = function() {
		var sizeTf  = 40;
		var posY    = 48;
		var offsetY = 84;
		
		_bgDark = new PIXI.Graphics();
		_bgDark.beginFill(0x000000).drawRect(0, 0, _W, _H).endFill();
		_bgDark.alpha = 0.5;
		_bgDark.visible = false;
		back_mc.addChild(_bgDark);
		
		var icoKey = addObj("icoKey", 52, posY);
		face_mc.addChild(icoKey);
		var icoBet = addObj("icoBet", 52, posY+offsetY*1);
		face_mc.addChild(icoBet);
		var icoTime = addObj("icoTime", 52, posY+offsetY*2);
		face_mc.addChild(icoTime);
		var icoWS = addObj("icoWS", 52, posY+offsetY*3);
		face_mc.addChild(icoWS);
		_tfAddress = addText(_openkey, sizeTf, "#ffffff", "#000000", "left", 600, 4);
		_tfAddress.x = icoKey.x + icoKey.w/2 + 10;
		_tfAddress.y = icoKey.y - _tfAddress.height/2;
		face_mc.addChild(_tfAddress);
		_tfBalance = addText("0  BET", sizeTf, "#ffffff", "#000000", "left", 400, 4);
		_tfBalance.x = _tfAddress.x;
		_tfBalance.y = icoBet.y - _tfBalance.height/2;
		face_mc.addChild(_tfBalance);
		_tfTime = addText("0", sizeTf, "#ffffff", "#000000", "left", 400, 4);
		_tfTime.x = _tfAddress.x;
		_tfTime.y =  icoTime.y - _tfTime.height/2;
		face_mc.addChild(_tfTime);
		_tfOpenTime = addText("", sizeTf, "#ffffff", "#000000", "center", 400, 4);
		_tfOpenTime.x = _W/2;
		_tfOpenTime.y =  _H - 100 - _tfOpenTime.height/2;
		face_mc.addChild(_tfOpenTime);
		_tfBlockchain = addText("", sizeTf, "#FFCC00", "#000000", "center", 700, 4);
		_tfBlockchain.x = _W/2;
		_tfBlockchain.y =  _H - 150 - _tfBlockchain.height/2;
		face_mc.addChild(_tfBlockchain);
		_tfWinStr = addText("0", sizeTf, "#ffffff", "#000000", "left", 400, 4);
		_tfWinStr.x = _tfAddress.x;
		_tfWinStr.y =  icoWS.y - _tfWinStr.height/2;
		face_mc.addChild(_tfWinStr);
		var tfVersion = addText(version, 24, "#ffffff", "#000000", "right", 400, 4);
		tfVersion.x = _W - 30;
		tfVersion.y = _H - tfVersion.height - 10;
		face_mc.addChild(tfVersion);
		
		_wndWS = new ItemWS();
		_wndWS.x = 190;
		_wndWS.y = 750;
		face_mc.addChild(_wndWS);
		
		_itemBet = new PIXI.Container();
		_itemBet.x = _W/2;
		_itemBet.y = 878;
		back_mc.addChild(_itemBet);
		var bgBet = addObj("bgBet");
		_itemBet.addChild(bgBet);
		var itemBet = addObj("itemBet", -120);
		_itemBet.addChild(itemBet);
		_tfBet = addText("", 60, "#ED9829", "#000000", "left", 400);
		_tfBet.x = -50;
		_tfBet.y = -_tfBet.height/2 - 5;
		_itemBet.addChild(_tfBet);
		_itemBet.visible = false;
	}
	
	_self.createBtn = function(){
		var doc = window.document;
		var docEl = doc.documentElement;
		_fRequestFullScreen = docEl.requestFullscreen || 
									docEl.mozRequestFullScreen || 
									docEl.webkitRequestFullScreen || 
									docEl.msRequestFullscreen;
		_fCancelFullScreen = doc.exitFullscreen || 
									doc.mozCancelFullScreen || 
									doc.webkitExitFullscreen || 
									doc.msExitFullscreen;
									
		_btnStart = addButton("btnText", _W/2, 878);
		_btnStart.overSc = true;
		_btnStart.name = "btnStart";
		_btnStart.visible = false;
		face_mc.addChild(_btnStart);
		_self.arButtons.push(_btnStart);
		var tfStart = addText(getText("new_game"), 34, "#FFFFFF", undefined, "center", 240);
		tfStart.x = 0;
		tfStart.y = -tfStart.height/2;
		_btnStart.addChild(tfStart);
		
		_pirateSave = addButton("btnText", _W/2 - 250, 450,);
		_pirateSave.name = "pirateSave";
		_pirateSave.visible = false;
		_pirateSave.overSc = true;
		var tfBtnSave = addText(getText("save"), 40, "#FFFFFF", undefined, "center", 300);
		tfBtnSave.x = 0;
		tfBtnSave.y = -tfBtnSave.height/2;
		_pirateSave.addChild(tfBtnSave);
		face_mc.addChild(_pirateSave);
		_self.arButtons.push(_pirateSave);
		
		_pirateContinue = addButton("btnText", _W/2 + 250, 450);
		_pirateContinue.name = "pirateContinue";
		_pirateContinue.overSc = true;
		_pirateContinue.visible = false;
		var tfBtnContinue = addText(getText("continue"), 40, "#FFFFFF", undefined, "center", 300);
		tfBtnContinue.x = 0;
		tfBtnContinue.y = -tfBtnContinue.height/2;
		_pirateContinue.addChild(tfBtnContinue);
		face_mc.addChild(_pirateContinue);
		_self.arButtons.push(_pirateContinue);
		
		// frame player address
		var wAdr = _tfAddress.width+10;
		var hAdr = 50;
		var btnFrame = new PIXI.Container();
		var objImg = new PIXI.Graphics();
		objImg.beginFill(0xFFCC00).drawRect(-wAdr/2, -hAdr/2, wAdr, hAdr).endFill();
		objImg.alpha = 0;
		btnFrame.addChild(objImg);
		btnFrame.over = new PIXI.Graphics();
		btnFrame.over.lineStyle(3, 0xFFCC00, 1);
		btnFrame.over.drawRect(-wAdr/2, -hAdr/2, wAdr, hAdr);
		btnFrame.over.visible = false;
		btnFrame.addChild(btnFrame.over);
		btnFrame.name = "btnAddress";
		btnFrame.w = objImg.width;
		btnFrame.h = objImg.height;
		btnFrame.x = _tfAddress.x + btnFrame.w/2 - 2;
		btnFrame.y = _tfAddress.y + btnFrame.h/2 - 7;
		btnFrame.interactive = true;
		btnFrame.buttonMode = true;
		btnFrame._selected = false;
		btnFrame._disabled = false;
		face_mc.addChild(btnFrame);
		_self.arButtons.push(btnFrame);
		
		var posX = 1840;
		var posY = 960;
		var offsetY = 135;
		var btnDao = addButton("btnDao", posX-4, posY - 0*offsetY);
		btnDao.tooltip = "home";
		btnDao.overSc = true;
		face_mc.addChild(btnDao);
		_self.arButtons.push(btnDao);
		var btnFullscreen = addButton("btnFullscreen", posX, posY - 1*offsetY);
		btnFullscreen.tooltip = "fullscreen";
		btnFullscreen.overSc = true;
		face_mc.addChild(btnFullscreen);
		_self.arButtons.push(btnFullscreen);
		_btnContract = addButton("btnContract", posX, posY - 2*offsetY);
		_btnContract.tooltip = "show_contract";
		_btnContract.overSc = true;
		face_mc.addChild(_btnContract);
		_self.arButtons.push(_btnContract);
		// _btnSave = addButton("btnSave", posX, posY - 3*offsetY);
		// _btnSave.tooltip = "save_data";
		// _btnSave.overSc = true;
		// face_mc.addChild(_btnSave);
		// _self.arButtons.push(_btnSave);
		var btnInstruct = addButton("btnInstruct", posX, posY - 3*offsetY);
		btnInstruct.tooltip = "instruction";
		btnInstruct.overSc = true;
		face_mc.addChild(btnInstruct);
		_self.arButtons.push(btnInstruct);
		var btnHistory = addButton("btnHistory", posX, posY - 4*offsetY);
		btnHistory.tooltip = "show_history";
		btnHistory.overSc = true;
		face_mc.addChild(btnHistory);
		_self.arButtons.push(btnHistory);
		_btnCashout = addButton("btnCashout", posX, posY - 5*offsetY);
		_btnCashout.tooltip = "cashout";
		_btnCashout.overSc = true;
		face_mc.addChild(_btnCashout);
		_self.arButtons.push(_btnCashout);
		var btnFacebook = addButton("btnFacebook", 1870, 48);
		btnFacebook.overSc = true;
		face_mc.addChild(btnFacebook);
		_self.arButtons.push(btnFacebook);
		var btnTwitter = addButton("btnTwitter", 1870, 123);
		btnTwitter.overSc = true;
		face_mc.addChild(btnTwitter);
		_self.arButtons.push(btnTwitter);
		
		// _btnSave.setAplhaDisabled(true);
		_btnCashout.setAplhaDisabled(true);
		_btnContract.setAplhaDisabled(true);
		
		// Tooltip
		_tooltip = new ItemTooltip();
		_tooltip.x = _W/2;
		_tooltip.y = _H/2;
		_tooltip.visible = false;
		tooltip_mc.addChild(_tooltip);
	}
	
	_self.createTreasure = function() {		
		if(_objGame == undefined){
			return;
		}
		var w = 1300;
		var offset = w/_objGame.countBox;
		var arPosY = [400, 250, 400];
		var arName = ["L", "", "R"];
		
		for (var i = 0; i < _objGame.countBox; i++) {
			var box = new ItemBox(_self, arName[i]);
			box.x = _W/2 - w/2 + offset*i + offset/2;
			box.y = arPosY[i];
			box.id = (i+1);
			game_mc.addChild(box);
			_self.arButtons.push(box);
			_arBoxes.push(box);
		}
	};
	
	_self.createWndInfo = function(str, callback, addStr) {
		if(_wndInfo == undefined){
			_wndInfo = new WndInfo(this);
			_wndInfo.x = _W/2;
			_wndInfo.y = _H/2;
			wnd_mc.addChild(_wndInfo);
		}
		
		_bWindow = true;
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		_wndInfo.show(str, callback, addStr)
		_wndInfo.visible = true;
		_curWindow = _wndInfo;
	}
	
	// REFRESH
	_self.refreshBalance = function() {
		_balanceSession = Number(_balanceSession.toFixed(2));
		_betGame = Number(_betGame.toFixed(2));
		var str =_balanceSession + "/(" + _balanceBet + ") BET"
		_tfBalance.setText(str);
	}
	
	_self.refreshData = function() {
		_self.showWndWarning(getText("loading"));
		
		// Quick return to the game is impossible
		var timeCheck = 3*60*1000; // 3 min
		var timeNow = getTimer();
		var timeActive = loginObj["timeActive"] || timeCheck;
		var diffTime = timeNow - timeActive;
		
		if(diffTime < timeCheck && loginObj["openChannel"]){
			var minutes = Math.ceil((timeCheck-diffTime)/(60*1000))
			var str = getText("error_quick_return").replace(new RegExp("NUM"), minutes);
			_self.showError(str, function(){
				_self.removeAllListener();
				window.location.reload();
			});
			return;
		}
		
		DCLib.Eth.getBalances(_openkey, function(res) {
			_wndWarning.visible = false;
			_balanceEth = Number(res.eth);
			_balanceBet = Number(res.bets);
			_self.refreshBalance();
			if(_balanceEth < 0.1){
				_self.showError("error_balance_eth", function(){
						_self.removeAllListener();
						window.open("/", "_self");
					});
			} else {
				// load game
				if(_bOpenChannel){
					console.log("LOAD GAME");
					
					var objConnect = {
						bankroll_address : _addressBankroll, 
						channel_id:_idChannel,
						room: _idRoom,
						player_address: _openkey
					};
					console.log("objConnect:", objConnect);
					App.reconnect(objConnect, function(res){
						console.log("!!!!!!!!!!!!!:", res);
						_self.createTreasure();
						if(_objGame.betGame == 0 && _balanceSession > 0){
							_btnStart.visible = true;
						}
						_btnContract.setAplhaDisabled(false);
					});
				// new game
				} else {
					// console.log("NEW GAME");
					_self.showWndDeposit();
					_self.showTutorial(1);
				}
			}
		})
	}
	
	_self.refreshButtons = function() {
		for (var i = 0; i < _self.arButtons.length; i++) {
			var item_mc = _self.arButtons[i];
			item_mc._selected = false;
		}
	}
	
	// CLOSE
	_self.closeWindow = function(wnd) {
		if(wnd){
			_curWindow = wnd;
		}
		if(_curWindow){
			_curWindow.visible = false;
			_curWindow = undefined;
			_bWindow = false;
		}
	}
	
	// SHOW
	_self.showWndDeposit = function() {
		if(_bWindow){
			return;
		}
		
		if(_wndDeposit == undefined){
			_wndDeposit = new WndDeposit(_self);
			_wndDeposit.x = _W/2;
			_wndDeposit.y = _H/2;
			wnd_mc.addChild(_wndDeposit);
		}
		DCLib.Eth.getBetBalance(_openkey, _self.getBetsBalance);
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		_bWindow = true;
		var str = getText("set_deposit").replace(new RegExp("SPL"), "\n");
		_wndDeposit.show(str, function(value){
					_self.startChannelGame(value);
				}, _balanceBet)
		_timeCloseWnd = 0;
		_wndDeposit.visible = true;
		_curWindow = _wndDeposit;
	}
	
	_self.showWndBet = function() {
		if(_bWindow){
			return;
		}
		if(_wndBet == undefined){
			var style = {bg:"bgWndBet",
				colorDesc:"#FFCC00"};
			_wndBet = new WndDeposit(_self, style);
			_wndBet.x = _W/2;
			_wndBet.y = _H/2;
			wnd_mc.addChild(_wndBet);
		}
		
		if(_idTutor == 1){
			_self.showTutorial(2);
		}
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		_bWindow = true;
		var str = getText("set_bet").replace(new RegExp("SPL"), "\n");
		_wndBet.show(str, function(value){
			_self.setBet(value);
		}, _balanceSession)
		_timeCloseWnd = 0;
		_wndBet.visible = true;
		_curWindow = _wndBet;
	}
	
	_self.showWndWin = function() {
		if(_bWindow){
			return;
		}
		if(_wndWin == undefined){
			_wndWin = new WndWin(_self);
			_wndWin.x = _W/2;
			_wndWin.y = _H/2;
			wnd_mc.addChild(_wndWin);
		}
		var str = getText("win") + "!";
		if(_objGame){
			str = "+" + (_objGame.bufferProfit);
		}
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		_itemTutorial.visible = false;
		_bWindow = true;
		_wndWin.show(str, _self.closeGame)
		_timeCloseWnd = 0;
		_wndWin.visible = true;
		_curWindow = _wndWin;
	}
	
	_self.showWndHistory = function() {
		if(_bWindow){
			return;
		}
		if(_wndHistory == undefined){
			_wndHistory = new WndHistory(_self, _depositPlayer);
			_wndHistory.x = _W/2;
			_wndHistory.y = _H/2;
			tooltip_mc.addChild(_wndHistory);
		}
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		_bWindow = true;
		if(options_arcade){
			_wndHistory.show(_logic.getHistory())
		} else {
			_wndHistory.show(App.logic.getHistory())
		}
		_timeCloseWnd = 0;
		_wndHistory.visible = true;
		_curWindow = _wndHistory;
	}
	
	_self.showTutorial = function(id) {		
		if(_itemTutorial == undefined){
			_objTutor = {};
			_itemTutorial = new ItemTutorial(_self);
			_itemTutorial.x = _W/2;
			_itemTutorial.y = _H/2;
			tutor_mc.addChild(_itemTutorial);
		}
		
		_idTutor = id;
		if(_objTutor[id] && id != 5){
			return;
		}
		_objTutor[id] = true;
		
		switch(id){
			default:
				_itemTutorial.x = 1450;
				_itemTutorial.y = 850;
				break;
		}
		
		_itemTutorial.show(getText("tutor_"+id));
		_itemTutorial.visible = true;
	}
	
	_self.showInstruction = function() {		
		if(_wndInstruction == undefined){
			_wndInstruction = new WndInstruction(this);
			_wndInstruction.x = _W/2;
			_wndInstruction.y = _H/2;
			_self.addChild(_wndInstruction);
		}
		
		_bWindow = true;
		_wndInstruction.visible = true;
		_curWindow = _wndInstruction;
	}
	
	_self.showWndWarning = function(str) {
		if(_wndWarning == undefined){
			_wndWarning = new PIXI.Container();
			_wndWarning.x = _W/2;
			_wndWarning.y = _H/2;
			warning_mc.addChild(_wndWarning);
			
			var bg = addObj("bgWndWarning");
			_wndWarning.addChild(bg);
			var tfTitle = addText(getText("please_wait"), 40, "#FFCC00", "#000000", "center", 470, 3)
			tfTitle.y = - 100;
			_wndWarning.addChild(tfTitle);
			var tf = addText("", 26, "#FFFFFF", "#000000", "center", 470, 3)
			tf.y = - 30;
			_wndWarning.addChild(tf);
			
			var loading = new ItemLoading();
			loading.x = 0;
			loading.y = 80;
			_wndWarning.addChild(loading);
			
			_wndWarning.tf = tf;
			_wndWarning.loading = loading;
		}
		
		_wndWarning.tf.setText(str);
		_wndWarning.tf.y = -_wndWarning.tf.height/2;
		_wndWarning.visible = true;
	}
	
	_self.showError = function(value, callback) {
		var str = "ERROR! \n\n " + getText(value) //+ " \n\n " + getText("contact_support");
		
		if(_wndWarning){
			_wndWarning.visible = false;
		}
		_self.refreshButtons();
		
		_self.createWndInfo(str, 
            function() {
                if (callback) {
                    if (typeof callback == 'function') {
                        callback();
                    }
                }
            }
		);
	}

	// CHANNEL
	_self.startChannelGame = function(deposit){
		deposit = Number(deposit);
		if(_idTutor == 1){
			_itemTutorial.visible = false;
		}
		
		_bWindow = false;
		var betGame = 0;
		var countWinStr = 0;
		var valPlayer = 0;
		var gameData = {type:'uint', value:[betGame, countWinStr, valPlayer]};
		
		_depositPlayer = deposit;
		if(options_arcade){
			_balanceSession = deposit;
			_self.refreshBalance();
			_idChannel = DCLib.Utils.makeSeed();
			
			_logic = new ArcadeLogic(deposit);
			
			_self.refreshButtons();
			if(_tooltip){
				_tooltip.visible = false;
			}
			_objGame = _self.getGame();
			_self.closeWindow();
			_self.createTreasure();
			_self.showWndBet();
			return;
		}
		
		_self.showWndWarning(getText("search_bankroller"));
		_timeSearchBankroller = TIME_SEARCH_BANKROLLER;
		
		// var addressBankroll = "0xb5f7cf8128f763cee4c92de122c2c7e83904010c"; // develop
		// var addressBankroll = "0xf67dc689473e620a715bcf595bf5ebb5a71360e3"; // j0x
		var addressBankroll = "0x146c5e3b9395738eb67feceb5e37cd5a56d63342"; // ilya
		
		_self.checkBankrollerOnline(addressBankroll, function(result){
			_timeSearchBankroller = 0;
			_tfOpenTime.setText("");
			_tfBlockchain.setText("");
				
			if(result){
				_timeResponse = TIME_RESPONSE;
		
				var objConnect = {
					bankroller : addressBankroll,
					paychannel:{deposit:deposit}, 
					gamedata:gameData
				};
				if(options_debug){
					objConnect = {bankroller : "auto"};
					_idChannel = DCLib.Utils.makeSeed();
				}
				_self.showWndWarning(getText("connecting"));
				
				if(objConnect.bankroller != "auto"){
					DCLib.Eth.getBalances(objConnect.bankroller, function(resBal) {
						var bankrEth = Number(resBal.eth);
						var bankrBet = Number(resBal.bets);
						if(bankrEth == 0 || bankrBet < deposit*2){
							_self.showError("error_balance_bankroll_bet", function(){
								_self.removeAllListener();
								window.location.reload();
							});
						} else {
							_self.connectToBankroll(objConnect, deposit);
						}				
					})
				} else {
					_self.connectToBankroll(objConnect, deposit);
				}
			} else {
				_self.showError(getText("error_bankroll_offline_to_arcade"), function(){
					options_arcade = true;
					_self.startChannelGame(_depositPlayer);
				});
			}
		})
		
		/*
		_timeResponse = TIME_RESPONSE;
		
		var objConnect = {
			bankroller : addressBankroll,
			paychannel:{deposit:deposit}, 
			gamedata:gameData
		};
		if(options_debug){
			objConnect = {bankroller : "auto"};
			_idChannel = DCLib.Utils.makeSeed();
		}
		_self.showWndWarning(getText("connecting"));
		
		if(objConnect.bankroller != "auto"){
			DCLib.Eth.getBalances(objConnect.bankroller, function(resBal) {
				var bankrEth = Number(resBal.eth);
				var bankrBet = Number(resBal.bets);
				if(bankrEth == 0 || bankrBet < deposit*2){
					_self.showError("error_balance_bankroll_bet", function(){
						_self.removeAllListener();
						window.location.reload();
					});
				} else {
					_self.connectToBankroll(objConnect, deposit);
				}				
			})
		} else {
			_self.connectToBankroll(objConnect, deposit);
		}*/
	}
	
	_self.checkBankrollerOnline = function(address, callback){
		var timeOut;
		
		_fCheckBankroller = function(data){
			if (data.user_id!=address) {
				return
			}
			
			App.sharedRoom.off('action::bankroller_active', _fCheckBankroller)
			callback(data)
		}

		App.sharedRoom.on('action::bankroller_active', _fCheckBankroller);
	}
	
	_self.connectToBankroll = function(objConnect, deposit){
		App.connect(objConnect, function(connected, info){
			console.log('Game connect:', connected, info);
			_timeResponse = 0;
			_tfOpenTime.setText("");
			_tfBlockchain.setText("");
			if (connected){
				_addressBankroll = info.bankroller_address;
				_idRoom = info.room_name;
				var transactionHash = "";
				if(info.channel){
					_idChannel = info.channel.channel_id;
					_curBlock = info.channel.blockNumber;
					addressContract = info.channel.contract_address;
					_depositBankroll = DCLib.Utils.dec2bet(info.channel.bankroller_deposit);
					if(info.channel.receipt){
						transactionHash = info.channel.receipt.transactionHash;
					}
				}
				_wndWarning.visible = false;
				if(addressContract  || options_debug){
					_balanceSession = deposit;
					_depositPlayer = deposit;
					if(addressContract){
						_contract = new DCLib.web3.eth.Contract(abiContract, addressContract);
						_self.getEndBlock();
						_bOpenChannel = true;
					}

					// App.Room.on('timeout', function(receipt) {
					// 	console.log('listen bankroll',receipt)
					// })

					DCLib.Eth.getBalances(_openkey, function(resBal) {
						_balanceEth = Number(resBal.eth);
						_balanceBet = Number(resBal.bets);
						_self.refreshBalance();
						
						App.call('initGame', [_openkey, _addressBankroll], function(result){
							if(addressContract){
								_btnContract.setAplhaDisabled(false);
							}
							_self.refreshButtons();
							if(_tooltip){
								_tooltip.visible = false;
							}
							_objGame = _self.getGame();
							_self.closeWindow();
							_self.createTreasure();
							_self.showWndBet();
							_self.saveGame();
						})
					})					
				} else {
					_self.showError("Please, wait 2 minutes and try again", function(){
						_self.startChannelGame(deposit)
						// _self.removeAllListener();
						// window.location.reload();
					});
				}
			} else {
				_self.showError(getText("error_bankroll_offline_to_arcade"), function(){
					options_arcade = true;
					_self.startChannelGame(_depositPlayer);
				});
			}
		})
	}
	
	_self.closeGameChannel = function(){
		if(_bCloseChannel || options_debug || !_gameOver){
			return false;
		}
		
		_bCloseChannel = true;
		_itemTutorial.visible = false;
		_btnCashout.setAplhaDisabled(true);
		_timeResponse = TIME_RESPONSE;
		
		if(App.logic){
			_self.showWndWarning(getText("disconnecting"));
			_btnStart.visible = false;
			var session = App.logic.session()

			App.disconnect({session:session}, function(res){
				_wndWarning.visible = false;
				_balanceSession = 0;
				_timeResponse = 0;
				_tfOpenTime.setText("");
				_tfBlockchain.setText("");
				_self.refreshButtons();
				console.log('Game disconnect:', res);
				if(res.channel){
					DCLib.Eth.getBalances(_openkey, function(resBal) {
						_balanceEth = Number(resBal.eth);
						_balanceBet = Number(resBal.bets);
						_self.refreshBalance();
					})
					var transactionHash = res.channel.transactionHash;
					_bOpenChannel = false;
					_self.createWndInfo(getText("close_channel"), function(){
						var url = "https://ropsten.etherscan.io/tx/" + transactionHash;
						window.open(url, "_blank");
						_self.showWndHistory();
					});
					_self.saveGame();
				} else {
					_self.showError(getText("disconnected"), function(){
						_self.removeAllListener();
						window.location.reload();
					});
				}
			})
		}
	}
	
	_self.checkOnline = function(){
		if(App){
			if(App.Room && _addressBankroll && !_bCloseChannel && _bOpenChannel){
				_offlineBanroller ++;
				App.request({action: "close_timeout"}, function(res) {
					_offlineBanroller = 0;
					if(_bReconnectBankroll){
						_bReconnectBankroll = false;
						_wndWarning.visible = false;
					}
					if (res.response.state_channel == false) {
						_bCloseChannel = true;
						if(!_bSendDispute){
							App.request({action: 'disconnect'})
							_self.closeWindow()
							_self.showError(getText("disconnected"), function(){
								_self.removeAllListener();
								window.location.reload();
							});
						}
					}
				})
			}
		}
		
		if(_offlineBanroller > 1 && _idBox > 0){
			if(_offlineBanroller > COUNT_BANKR_OFFLINE){
				_self.sendDispute();
			} else {
				if(!_wndWarning.visible){
					_bReconnectBankroll = true;
					_self.showWndWarning(getText("reconnect_bankroll"));
				}
			}
		}
	}
	
	// DC	
	_self.getBetsBalance = function(value) {
		_balanceBet = Number(value);
		_self.refreshBalance();
	}
	
	// ACTION
	_self.setBet = function(value) {
		_betGame = Number(value);
		_betGame = Number(_betGame.toFixed(2));
		_balanceGame = _betGame;
		_balanceSession -= _betGame;
		_self.refreshBalance()
		_itemBet.visible = true;
		_pirateSave.visible = false;
		_pirateContinue.visible = false;
		_bgDark.visible = false;
		_gameOver = false;
		
		if(_idTutor == 2){
			_self.showTutorial(3);
		}
		
		_tfBet.setText(_betGame);
		_wndWS.setBet(_betGame);
	}
	
	_self.refreshBoxes = function() {
		for (var i = 0; i < _arBoxes.length; i++) {
			var box = _arBoxes[i];
			box.refresh();
		}
	}
	
	_self.newGame = function() {
		if(_balanceSession < 0.01){
			_self.showError(getText("error_balance_bet"), function(){
				_self.removeAllListener();
				window.open("/", "_self");
			});
		} else {
			if(_idTutor == 4){
				_itemTutorial.visible = false;
			}
			_self.refreshBoxes();
			_gameOver = false;
			_btnStart.visible = false;
			_btnCashout.setAplhaDisabled(true);
			_self.showWndBet();
		}
	}
	
	_self.continueGame = function() {
		_gameOver = false;
		_pirateSave.visible = false;
		_pirateContinue.visible = false;
		_bgDark.visible = false;
		_itemTutorial.visible = false;
		if(options_debug || options_arcade){
			_self.refreshBoxes();
		} else {
			_self.updateState(_self.refreshBoxes, false);
		}
	}
	
	_self.closeGame = function() {
		if(options_arcade){
			var result = _logic.closeGame();
			_objGame = result.objGame;
			_balanceSession = result.balance;
			_self.refreshBalance();
				_balanceGame = 0;
				_self.closeGameUI();
			return;
		}
		
		App.call('closeGame', [], function(result){
			 if(App.logic.getBalance() == result.balance){
				 _objGame = result.objGame;
				_balanceSession = result.balance;
				if(options_debug){
					_balanceSession = _depositPlayer + App.logic.payChannel.getProfit();
				}
				_self.refreshBalance();
				_balanceGame = 0;
				_self.closeGameUI();
			 } else {
				 _self.showError(getText("Conflict closeGame"));
			 }
		})
	}
	
	_self.closeGameUI = function() {
		_gameOver = true;
		_pirateSave.visible = false;
		_pirateContinue.visible = false;
		_bgDark.visible = false;
		_itemBet.visible = false;
		_bCloseChannel = false;
		if (options_debug || options_arcade) {
			_btnStart.visible = true;
		} else {
			_btnCashout.setAplhaDisabled(false);
			_self.updateState(
				function(){
					if(_balanceSession == 0){
						_self.closeGameChannel();
					} else {
						_btnStart.visible = true;
					}
					_self.saveGame();
				},
				true
			);
		}
	}
	
	// DISPUTE
	_self.updateState = function(callback, bSaveChannel) {
		if (options_debug) {
			return;
		}
		var balancePlayer = DCLib.Utils.bet2dec(App.logic.payChannel.getBalance());
		var balanceBankroll = DCLib.Utils.bet2dec(App.logic.payChannel.getBankrollBalance());
		var session = App.logic.session();
		var hash = DCLib.web3.utils.soliditySha3(_idChannel, balancePlayer, balanceBankroll, session);
		var signPlayer = DCLib.Account.signHash(hash);
		
		App.updateState({
			channel_id: _idChannel,
			player_address: _openkey,
			player_balance: balancePlayer,
			bankroller_balance: balanceBankroll,
			session: session,
			signed_args: signPlayer
			}, result => {
				if(bSaveChannel){
					_objCurSessionChannel.session = session;
					_objCurSessionChannel.winstrict = App.logic.getGame().countWinStr;
					_objCurSessionChannel.player_balance = balancePlayer;
					_objCurSessionChannel.bankroller_balance = balanceBankroll;
					_objCurSessionChannel.signPlayer = signPlayer;
					_objCurSessionChannel.signBankroll = result.signed_bankroller;
				}
				
				if(typeof callback == "function"){
					callback();
				}
			}
		)
	}
	
	_self.updateChannel = function() {
		if (options_debug) return
		
		console.log('updateChannel:', _objCurSessionChannel);
		_self.showWndWarning(getText("stay_in_the_game") + "\n" + getText("update_channel"));
		var round = App.logic.getGame().round;
		var obj = {
			player_balance: _objCurSessionChannel.player_balance,
			bankroller_balance: _objCurSessionChannel.bankroller_balance,
			session: _objCurSessionChannel.session,
			signed_args: _objCurSessionChannel.signBankroll
		};
		
		if(_bOfflineBankroll && App.logic.getGame().countWinStr > 0){
			round ++;
		}
		// round++; // FOR TEST: UC -> UG -> OD
		
		if(round > 1){
			App.updateChannel(obj, 
				function(params) {
					_objDispute.action = "updateGame";
					_objDispute.params = params;
					_objDispute.time = 15000;
				}
			);
		} else {
			App.updateChannel(obj,
				function(params) {
					_objDispute.action = "openDispute";
					_objDispute.params = params;
					_objDispute.time = 15000;
				}
			);
		}
	}
	
	_self.updateGame = function() {
		if (options_debug || _bUpdateGame) return
		
		_bUpdateGame = true;
		_self.showWndWarning(getText("stay_in_the_game") + "\n" + getText("update_game"));
		
		App.updateGame({
			session: _objCurSessionGame.session,
			round: _objCurSessionGame.round,
			seed: _objCurSessionGame.seed,
			game_data: _objCurSessionGame.game_data,
			sig_player: _objCurSessionGame.sig_player,
			sig_bankroll: _objCurSessionGame.sig_bankroll
		}, 
			function(params) {
				_objDispute.action = "openDispute";
				_objDispute.params = params;
				_objDispute.time = 15000;
			}
		);
	}
	
	_self.openDispute = function(res) {
		if (options_debug) return
		
		console.log('openDispute', _bOfflineBankroll);
		_self.showWndWarning(getText("stay_in_the_game") + "\n" + getText("open_dispute"));
		var betGame = DCLib.Utils.bet2dec(_betGame);		
		var round = App.logic.getGame().round;
		// round++; // FOR TEST: UC -> UG -> OD
		var session = App.logic.session();
		// session++; // FOR TEST: UC -> OD
		_disputeSeed = DCLib.Utils.makeSeed();
		var gameData = {type:'uint', value:[betGame, App.logic.getGame().countWinStr, _idBox]};
		
		if(_bOfflineBankroll){
			if(_bUpdateGame){
				round++;
			} else {
				session++;
			}
		}
		
		App.openDispute({
			round: round,
			session: session,
			dispute_seed: _disputeSeed,
			gamedata: gameData
		}, _self.sendingDispute);
	}
	
	_self.sendDispute = function() {
		if(options_debug){
			return;
		}
		if(_bSendDispute){
			return;
		}
		
		_self.showWndWarning(getText("dispute_resolve"));
		_bSendDispute = true;
		_bOfflineBankroll = (_offlineBanroller > COUNT_BANKR_OFFLINE);
		
		var session = App.logic.session();
		
		if(session > 0){
			_self.updateChannel();
		} else {
			_self.openDispute();
		}
	}
	
	_self.sendingDispute = function(obj) {
		_wndWarning.visible = false;
		_disputeBlock = obj.blockNumber;
		_self.getCurBlock();
		loginObj["openChannel"] = false;
		_self.saveGame();
		
		_self.createWndInfo(getText("sending_dispute"), function(){
			_self.showWndWarning(getText("stay_in_the_game") + "\n" + getText("sending_dispute"));
		});
		
		App.request({
			action: 'close_dispute',
			close_args: {
				dispute_seed: _disputeSeed,
				channel_id: _idChannel,
				player_address: _openkey
			}
		}).then(function(res) {
			_bCloseDispute = true;
			_wndWarning.visible = false;
			
			_self.createWndInfo(getText("closed_dispute"), function(){
				var url = "https://ropsten.etherscan.io/tx/" + res.receipt.transactionHash;
				window.open(url, "_blank");
			});
		})
	}
	
	_self.closeDispute = function() {
		if(_bCloseDispute){
			return;
		}
		
		_tfTime.setText("0 " + getText("block"));
		_bCloseDispute = true;
		_self.showWndWarning(getText("dispute_close"));
		App.closeByTime(_self.closedDispute);
	}
	
	_self.closedDispute = function(obj) {
		_wndWarning.visible = false;
		console.log("closedDispute", obj);
		
		if(obj.transactionHash){
			_self.createWndInfo(getText("closed_dispute"), function(){
				var url = "https://ropsten.etherscan.io/tx/" + obj.transactionHash;
				window.open(url, "_blank");
			});
		}
	}
	
	_self.getCurBlock = function() {
		DCLib.web3.eth.getBlockNumber().then(function(value) {
			_curBlock = value;
			var difBlock = _endBlock - _curBlock;
			if(_endBlock && _curBlock){
				if(!_bCloseChannel && _bOpenChannel && difBlock > 0){
					var strBl = difBlock + " " + getText("block");
					if(difBlock > 1){
						strBl = difBlock + " " + getText("blocks");
					}
					_tfTime.setText(strBl);
				}
				if(_disputeBlock && !_bCloseDispute){
					if(difBlock > 0){
						var str = getText("dispute_process").replace(new RegExp("NUM"), difBlock);
						_self.showWndWarning(getText("stay_in_the_game") + "\n" + str);
					} else {
						_self.closeDispute();
					}
				}
			}
		})
	}
	
	_self.getEndBlock = function() {
		if(_idChannel){
			// get end block for dispute
			_contract.methods.channels(_idChannel).call().then(function(res) {
				_endBlock = Number(res.endBlock) + 3;
				_self.getCurBlock();
			});
		}
	}
	
	// CLICK
	_self.clickBox = function(box) {
		if(_gameOver){
			return;
		}
		_gameOver = true;
		_idBox = box.id;
		var result = {};
		box.setSelected(true);
		
		if(_idTutor == 3){
			_itemTutorial.visible = false;
		}
		
		var idChannel = _idChannel;
		var session = App.logic.session();
		var round = App.logic.getGame().round;
		var seed = DCLib.Utils.makeSeed();
		var betGame = DCLib.Utils.bet2dec(_betGame);
		if(App.logic.getGame().countWinStr > 0){
			betGame = 0;
		}
		if(options_arcade && _logic.getGame().countWinStr > 0){
			betGame = 0;
		}
		
		var gameData = {type:'uint', value:[betGame, App.logic.getGame().countWinStr, box.id]};
		var hash = DCLib.web3.utils.soliditySha3(idChannel, session, round, seed, gameData);
		var signPlayer = DCLib.Account.signHash(hash);
		
		if(options_arcade){
			var result = _logic.clickBox(session, round, gameData);
			_self.showResult(result, box);
			return;
		}
		
		if(_offlineBanroller > COUNT_BANKR_OFFLINE && _idBox > 0){
			return;
		}
		
		//for test dispute
		// if(session > 0){
			// _self.sendDispute();
			// return;
		// }

		var strError = getText("invalid_signature_bankroll").replace(new RegExp("ADR"), addressContract);
		
		App.call('signBankroll', 
			[idChannel, session, round, seed, gameData, signPlayer], 
			function(result){
				if(result.error){
					_self.showError(result.error, _self.sendDispute);
					console.log(result.error);
					return;
				}
				
				App.call('clickBox', 
					[idChannel, session, round, seed, gameData, result.signBankroll], 
					function(result){
						if(result.error){
							if(result.error == "invalid_signature_bankroll"){
								_self.showError(strError, _self.sendDispute);
							} else {
								_self.showError(result.error);
							}
							return;
						}
						
						if(!DCLib.checkHashSig(hash, result.signBankroll, _addressBankroll)){
							_self.showError(strError, _self.sendDispute);
							return;
						}
						
						_objGame = result.objGame;
						session = App.logic.session();
						round = _objGame.round;
						gameData = {type:'uint', value:[betGame, _objGame.countWinStr, _idBox]};
						hash = DCLib.web3.utils.soliditySha3(idChannel, session, round, seed, gameData);
						signPlayer = DCLib.Account.signHash(hash);
						
						_objCurSessionGame.session = session;
						_objCurSessionGame.round = round;
						_objCurSessionGame.seed = seed;
						_objCurSessionGame.game_data = gameData;
						_objCurSessionGame.sig_player = signPlayer;
						_objCurSessionGame.sig_bankroll = result.signStateBankroll;
						
						var valueBankroller = DCLib.numFromHash(result.signBankroll, 1, _objGame.countBox);
						if(valueBankroller == _objGame.valueBankroller){
							_self.showResult(result, box);
						} else {
							_self.showError(getText("conflict_box"));
						}
					}
				)
			}
		)
	}
	
	_self.fullscreen = function() {
		 if(options_fullscreen) { 
			_fCancelFullScreen.call(window.document);
			options_fullscreen = false;
		}else{
			_fRequestFullScreen.call(window.document.documentElement);
			options_fullscreen = true;
		}
	}
	
	_self.clickContract = function() {
		var url = urlEtherscan + "address/" + addressContract;
		window.open(url, "_blank"); 
	}
	
	_self.clickCashout = function() {
		_self.closeGameChannel();
	}
	
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
		
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		item_mc._selected = false;
		if(item_mc.over && item_mc.name != "ItemBox"){
			item_mc.over.visible = false;
		}
		if(item_mc.overSc){
			item_mc.scale.x = 1*item_mc.sc;
			item_mc.scale.y = 1*item_mc.sc;
		}
		
		if(item_mc.name == "ItemBox"){
			_self.clickBox(item_mc);
		} else if(item_mc.name == "btnStart"){
			_self.newGame();
		} else if(item_mc.name == "pirateContinue"){
			_self.continueGame();
		} else if(item_mc.name == "pirateSave"){
			_self.showWndWin();
		} else if(item_mc.name == "btnHistory"){
			_self.showWndHistory();
		} else if(item_mc.name == "btnFullscreen"){
			_self.fullscreen();
		} else if(item_mc.name == "btnContract"){
			_self.clickContract();
		} else if(item_mc.name == "btnCashout"){
			_self.clickCashout();
		} else if(item_mc.name == "btnSave"){
			_self.updateChannel();
		} else if(item_mc.name == "btnInstruct"){
			_self.showInstruction();
		} else if(item_mc.name == "btnAddress"){
			var url = urlEtherscan + "address/" + _openkey;
			window.open(url, "_blank");
		} else if(item_mc.name == "btnDao"){
			// var url = "https://platform.dao.casino/";
			var url = "/";
			window.open(url, "_blank");
		} else if(item_mc.name == "btnFacebook"){
			_self.clickFB();
		} else if(item_mc.name == "btnTwitter"){
			_self.clickTwitter();
		}
	}
	
	_self.checkButtons = function(evt){
		if(_bWindow){
			return;
		}
		var mouseX = evt.data.global.x;
		var mouseY = evt.data.global.y;
		
		if(_tooltip){
			_tooltip.visible = false;
		}
		
		for (var i = 0; i < _self.arButtons.length; i++) {
			var item_mc = _self.arButtons[i];
			if(hit_test_rec(item_mc, item_mc.w, item_mc.h, mouseX, mouseY)){
				if(item_mc._selected == false && !item_mc._disabled && item_mc.visible){
					item_mc._selected = true;
					if(item_mc.over){
						if(item_mc.name == "ItemBox"){
							if(_gameOver){
								item_mc._selected = false;
								break;
							}
							item_mc.main.visible = false;
						}
						item_mc.over.visible = true;
					} else if(item_mc.overSc){
						item_mc.scale.x = 1.1*item_mc.sc;
						item_mc.scale.y = 1.1*item_mc.sc;
					}
					
					if(item_mc.name == "pirateSave" && _itemTutorial){
						_itemTutorial.show(getText("save_prize"));
					} else if(item_mc.name == "pirateContinue" && _itemTutorial){
						_itemTutorial.show(getText("continue_game"));
					}
				}
				
				if(item_mc.visible){
					if(_tooltip && item_mc.tooltip){
						_tooltip.show(getText(item_mc.tooltip));
						_tooltip.x = item_mc.x - (item_mc.w/2 + _tooltip.w/2);
						_tooltip.y = item_mc.y;
						_tooltip.visible = true;
						if(_tooltip.x + _tooltip.w/2 > _W){
							_tooltip.x = _W - _tooltip.w/2;
						}
						if(_tooltip.y - _tooltip.h/2 < 0){
							_tooltip.y = _tooltip.h/2;
						}
					}
				}
			} else {
				if(item_mc._selected){
					item_mc._selected = false;
					if(item_mc.over){
						item_mc.over.visible = false;
						if(item_mc.name == "ItemBox"){
							item_mc.main.visible = true;
						}
					} else if(item_mc.overSc){
						item_mc.scale.x = 1*item_mc.sc;
						item_mc.scale.y = 1*item_mc.sc;
					}
				}
			}
		}
	};
	
	// UPDATE
	_self.update = function(diffTime) {	
		if(_timeCloseWnd > 0 && _curWindow && _bWindow){
			_timeCloseWnd -= diffTime;
			if(_timeCloseWnd < 100){
				_timeCloseWnd = 0;
				_curWindow.visible = false;
				_curWindow = undefined;
				_bWindow = false;
			}
		}
		
		if(_timeSearchBankroller > 0 && !options_arcade){
			_timeSearchBankroller -= diffTime;
			if(_timeSearchBankroller < 1){
				_tfOpenTime.setText("");
				_tfBlockchain.setText("");
				App.sharedRoom.off('action::bankroller_active', _fCheckBankroller);
				_self.showError(getText("error_bankroll_offline_to_arcade"), function(){
					options_arcade = true;
					_self.startChannelGame(_depositPlayer);
				});
			}
		}
		
		if(_timeResponse > 0 && !options_arcade){
			if(_objDispute && _objDispute.time > 0){}else{
				_timeResponse -= diffTime;
				_timePhrase += diffTime;
				_tfOpenTime.setText(getNormalTime(_timeResponse));
				if(_timePhrase > 3000){
					_timePhrase = 0;
					var str = "phrase_blockchain_" + Math.ceil(Math.random()*4);
					_tfBlockchain.setText(getText(str));
				}
				if(_timeResponse < 1){
					_tfOpenTime.setText("");
					_tfBlockchain.setText("");
					if(_bOpenChannel){
						_self.showError(getText("error_bankroll_offline"), function(){
							_self.removeAllListener();
							window.location.reload();
						});
					} else {
						_self.showError(getText("error_bankroll_offline_to_arcade"), function(){
							options_arcade = true;
							_self.startChannelGame(_depositPlayer);
						});
					}
				}
			}
		}
		
		if(!options_arcade && !options_debug && _addressBankroll){
			_timeOnline += diffTime;
			if(_timeOnline > TIME_ONLINE){
				_timeOnline = 0;
				_self.checkOnline();
			}
			
			_timeBlock += diffTime;
			if(_timeBlock > TIME_BLOCK){
				_timeBlock = 0;
				_self.getCurBlock();
				
			}
			
			// dispute
			if(_objDispute && _objDispute.time > 0){
				_objDispute.time -= diffTime;
				if(_objDispute.time < 1){
					if(_objDispute.action == "updateGame"){
						_self.updateGame(_objDispute.params);
					} else if(_objDispute.action == "openDispute"){
						_self.openDispute(_objDispute.params);
					}
				}
			}
			// if(_disputeBlock && _curBlock && _endBlock && !_bCloseDispute){
				
			// }
		}
		
		if(_wndWarning){
			if(_wndWarning.visible){
				_wndWarning.loading.update(diffTime);
			}
		}
		
		if(_gameOver){
			return;
		}
	};

	// RESULT
	_self.showResult = function(result, box){
		_objGame = result.objGame;
		if(options_arcade){
			_balanceSession =  _logic.getBalance();
		} else {
			_balanceSession =  App.logic.getBalance();
		}
		if(options_debug){
			_balanceSession = _depositPlayer + App.logic.payChannel.getProfit()
		}
		
		_self.refreshBalance();
		_balanceGame = _objGame.bufferProfit;
		_tfWinStr.setText(_objGame.countWinStr);
		_self.saveGame();
		
		for (var i = 0; i < _arBoxes.length; i++) {
			var item_mc = _arBoxes[i];
			item_mc.setDisabled(true);
		}
		
		if(_objGame.win){
			box.openBox(true);
			_wndWS.refreshWS(_objGame.countWinStr);
		} else {
			box.openBox(false);
			_wndWS.clear();
		}
		_tfBet.setText(_balanceGame.toFixed(2));
		
		var it = new ItemResult(_objGame.win, box.x, box.y-200)
		face_mc.addChild(it)
		
		createjs.Tween.get({}).to({},1000)
				.call(function(){
					var ind = 0;
					for (var i = 0; i < _arBoxes.length; i++) {
						var item_mc = _arBoxes[i];
						if(item_mc.id == _objGame.valueBankroller){
							item_mc.openBox(true);
						} else {
							item_mc.openBox(false);
						}
					}
				});
				
		createjs.Tween.get({}).to({},2500)
				.call(function(){
					_self.fixResult();
				});
	};
	
	_self.fixResult = function(){
		_idBox = 0;
		if(_objGame.win){
			if(_objGame.round < 5){
				_bgDark.visible = true;
				_pirateSave.visible = true;
				_pirateContinue.visible = true;
				_self.showTutorial(5);
			} else {
				_self.showWndWin();
			}
		} else {
			// Game Over
			if(_objGame.result){
				_self.closeGameUI();
			}
			_self.showTutorial(4);
		}
	}

	_self.getGame = function(){
		if(options_arcade){
			return _logic.getGame();
		}
		if (!App.logic || !App.logic.getGame) { 
			return false; 
		}
		return App.logic.getGame()
	}
	
	// REMOVE
	_self.removeAllListener = function() {
		clearClips();
		
		if(_wndDeposit){
			_wndDeposit.removeAllListener();
		}
		if(_wndBet){
			_wndBet.removeAllListener();
		}
		if(_wndInfo){
			_wndInfo.removeAllListener();
		}
		if(_wndWin){
			_wndWin.removeAllListener();
		}
		
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

ScrGame.prototype = new InterfaceObject();
