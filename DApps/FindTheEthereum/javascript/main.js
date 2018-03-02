var _W = 1920;
var _H = 1080;
var version = "v. 0.0.6";
var loginObj = {};
var dataAnima = [];
var dataMovie = [];
var arClips = [];
var language;
var addressContract;
var urlEtherscan = "https://ropsten.etherscan.io/";

var currentScreen, scrContainer;
var LoadBack, LoadPercent;
var startTime;
var fps = 30;
var interval = 1000/fps;
var renderer, stage, preloader, colorFilter; // pixi;
var sprites_loaded = false;
var fontMain = "Archivo Black";
	fontMain = "Roboto Bold";

// options
var options_debug = false;
var options_arcade = false;
var options_pause = false;
var options_fullscreen = false;

function init() {
	if(typeof console === "undefined"){ console = {}; }
	
	// hide scroll
	var s=document.documentElement.style;
	s.cssText=s.cssText?"":"overflow:hidden;width:100%;height:100%";
	// document.body.scroll = "no";
	
	//initialize the stage
	renderer = PIXI.autoDetectRenderer(_W, _H);
	document.body.appendChild(renderer.view);
	stage = new PIXI.Container();
	// filter
	colorFilter = new PIXI.filters.ColorMatrixFilter();
	colorFilter.desaturate();
	
	window.addEventListener("resize", onResize, false);
	
	startTime = getTimer();
	onResize();
	update();
	
	language = new daoLang();
	language.add_lang_xml('en');
	language.loadSettings();
	
	LoadBack = new PIXI.Container();
	stage.addChild(LoadBack);
	scrContainer = new PIXI.Container();
	stage.addChild(scrContainer);
	
	createScreenLoader();
	loadManifest();
}

function loadLib() {	
	// Wait when DClib loaded
	DCLib.on('ready', function(){
		// Create our DApp
		window.App = new DCLib.DApp({
			slug: 'DC_FindTheEthereum_v2017',
			contract: {
				contract_address: '0xf4b062b7eb7ae80fb5fdfbb3eae16399eaca3647',
				contract_abi: abiContract
			}
		})
		
		init();
	})
}

function saveData() {
	if(isLocalStorageAvailable()){
		var loginStr = JSON.stringify(loginObj);
		localStorage.setItem('dc_fte', loginStr);
		// console.log("Saving: ok!");
	}
}

function loadData() {
	if(isLocalStorageAvailable()){
		if (localStorage.getItem('dc_fte')){
			var loginStr = localStorage.getItem('dc_fte')
			loginObj = JSON.parse(loginStr);
			// console.log("Loading: ok!");
		} else {
			// console.log("Loading: fail!");
		}
	}
}

function resetData() {
	loginObj = {};
	saveData();
}

function isLocalStorageAvailable() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
		console.log("localStorage_failed:",e);
        return false;
    }
}

function createScreenLoader(){
	var w = 600;
	var h = 50;
	LoadBack.x = _W/2;
	LoadBack.y = _H/2;
	var frameLoading = new PIXI.Graphics();
	frameLoading.lineStyle(3, 0xFFFFFF, 1);
	frameLoading.drawRect(-w/2, -h/2, w, h);
	LoadBack.addChild(frameLoading);
	var barLoading = new PIXI.Graphics();
	barLoading.beginFill(0xFFFFFF).drawRect(0, -h/2, w, h).endFill();
	barLoading.x = - w/2;
	LoadBack.addChild(barLoading);
	LoadBack.barLoading = barLoading;
	LoadBack.barLoading.scale.x = 0;
	
	LoadPercent = addText("loading", 32, "#FFFFF", undefined, "center", 500, 3)
	LoadPercent.y = 100;
	LoadBack.addChild(LoadPercent);
}

function loadManifest(){
	preloader = new PIXI.loaders.Loader();
	
	preloader.add("bgMenu", "images/bg/bgMenu.jpg");
	preloader.add("bgGame", "images/bg/bgGame.jpg");
	preloader.add("bgDark", "images/bg/bgDark.png");
	preloader.add("bgWndDeposit", "images/bg/bgWndDeposit.png");
	preloader.add("bgWndInfo", "images/bg/bgWndInfo.png");
	preloader.add("bgWndWarning", "images/bg/bgWndWarning.png");
	preloader.add("bgWndWS", "images/bg/bgWndWS.png");
	preloader.add("bgWndWS1", "images/bg/bgWndWS1.png");
	preloader.add("bgWndBet", "images/bg/bgWndBet.png");
		
	preloader.add("images/texture/BoxesTexture.json");
	preloader.add("images/texture/ItemsTexture.json");
	
	//сохраняем счетчик кол-ва файлов для загрузки
	preloader.on("progress", handleProgress);
	preloader.load(handleComplete);
}

function spritesLoad() {
	if(sprites_loaded){
		return true;
	}
	sprites_loaded = true;
	
	var img, data;
}

function textureLoad() {
	iniSetArt("images/texture/BoxesTexture.json");
	iniSetArt("images/texture/ItemsTexture.json");
}

function iniSet(set_name) {
	var json = preloader.resources[set_name]
	if(json){}else{
		console.log("ERROR: " + set_name + " is undefined");
		return;
	}
	json = json.data;
	
	var jFrames = json.frames;
	var data = preloader.resources[set_name].textures; 
	var dataTexture = [];
	var animOld = "";
	// console.log("set_name:", set_name);
	
	if(data && jFrames){
		for (var namePng in jFrames) {
			var index = namePng.indexOf(".png");
			var nameFrame = namePng;
			if (index > 1) {
				nameFrame = namePng.slice(0, index);
			}
			// console.log("nameFrame:", nameFrame, index2);
			
			var index2 = nameFrame.indexOf("/");
			if (index2 > 1) {
				var type = nameFrame.slice(0, index2); // тип анимации
				var anim = type; // имя сета
				if(anim != animOld){
					animOld = anim;
					dataTexture[anim] = [];
				}
				dataTexture[anim].push(PIXI.Texture.fromFrame(namePng));
				// console.log(nameFrame + ": ", anim, namePng);
			}
		}
		
		for (var name in dataTexture) {
			var arrayFrames = dataTexture[name]; // какие кадры используются в сети
			dataMovie[name] = arrayFrames;
			// console.log(name + ": ", arrayFrames);
			// console.log(name);
		}
	}
}

function iniSetArt(set_name) {	
	var json = preloader.resources[set_name]
	if(json){}else{
		console.log("ERROR: " + set_name + " is undefined");
		return;
	}
	
	json = json.data;
	if(json){}else{
		console.log("ERROR: " + set_name + " data is null");
		return;
	}
	var frames = json.frames;
	var data = preloader.resources[set_name].textures; 
	// console.log("set_name:", set_name);
	
	if(data && frames){
		for (var namePng in frames) {
			var index = namePng.indexOf(".png");
			var nameFrame = namePng;
			if (index > 1) {
				nameFrame = namePng.slice(0, index);
			}
			dataAnima[nameFrame] = data[namePng];
			// console.log("nameFrame:", nameFrame);
		}
	}
}

function handleProgress(){
	var percent = preloader.progress;
	LoadBack.barLoading.scale.x = percent/100;
	if(LoadPercent){
		LoadPercent.setText(percent + "%");
	}
}

function handleComplete(evt) {
	loadData();
	spritesLoad();
	textureLoad();
	onResize();
	
	start();
}

function getTimer(){
	var d = new Date();
	var n = d.getTime();
	return n;
}

function refreshTime(){
	startTime = getTimer();
}

function update() {
	requestAnimationFrame(update);
	renderer.render(stage);
	
	var diffTime = getTimer() - startTime;
	if (diffTime > interval) {
		if (currentScreen) {
			currentScreen.update(diffTime);
		}
		
		if(!options_pause){
			for (var i = 0; i < arClips.length; i++) {
				var clip = arClips[i];
				if(clip){
					clip.enter_frame();
				}
			}
		}
		
		startTime = getTimer();
	}
}

function clearClips() {
	for (var i = 0; i < arClips.length; i++) {
		var clip = arClips[i];
		if(clip){
			clip.removed_from_stage();
			clip.die();
		}
	}
	
	arClips = [];
}

function removeSelf(obj) {
	if (obj) {
		if (obj.parent.contains(obj)) {
			obj.parent.removeChild(obj);
		}
	}
}

function start() {
	if (LoadBack) {
        stage.removeChild(LoadBack);
    }
	
	addScreen("ScrMenu");
	// addScreen("ScrGame");
}

function addScreen(name) {
	if(currentScreen){
		scrContainer.removeChild(currentScreen);
	}
	
	currentScreen = new window[name]();
	scrContainer.addChild(currentScreen);
	currentScreen.name = name;
}

function addObj(name, _x, _y, _scGr, _scaleX, _scaleY) {
	if(_x){}else{_x = 0;}
	if(_y){}else{_y = 0;}
	if(_scGr){}else{_scGr = 1;}
	if(_scaleX){}else{_scaleX = 1;}
	if(_scaleY){}else{_scaleY = 1;}
	var obj = new PIXI.Container();
	obj.scale.x = _scGr*_scaleX;
	obj.scale.y = _scGr*_scaleY;
	
	var objImg = null;
	if(dataAnima[name]){
		objImg = new PIXI.Sprite(dataAnima[name]);
	} else if(dataMovie[name]){
		objImg = new PIXI.extras.MovieClip(dataMovie[name]);
		objImg.stop();
	}else{
		var data = preloader.resources[name];
		if(data){
			objImg = new PIXI.Sprite(data.texture);
		} else {
			return null;
		}
	}
	if(objImg.anchor){
		objImg.anchor.x = 0.5;
		objImg.anchor.y = 0.5;
	}
	obj.w = objImg.width*obj.scale.x;
	obj.h = objImg.height*obj.scale.y;
	obj.addChild(objImg);
	obj.x = _x;
	obj.y = _y;
	obj.name = name;
	obj.img = objImg;
	obj.r = obj.w/2;
	obj.rr = obj.r*obj.r;
	
	obj.setReg0 = function () {
		if(objImg.anchor){
			objImg.anchor.x = 0;
			objImg.anchor.y = 0;
		}
    }
    obj.setRegX = function (procx) {
		if(objImg.anchor){
			objImg.anchor.x = procx;
		}
    }
    obj.setRegY = function (procy) {
		if(objImg.anchor){
			objImg.anchor.y = procy;
		}
    }
	
	return obj;
}
function addText(text, size, color, glow, _align, width, px, font){
	if(size){}else{size = 24;}
	if(color){}else{color = "#FFFFFF";}
	if(glow){}else{glow = undefined;}
	if(_align){}else{_align = "center";}
	if(width){}else{width = 600;}
	if(px){}else{px = 2;}
	if(font){}else{font = fontMain;}
	
	var style;
	
	if(glow){
		style = {
			font : size + "px " + font,
			fill : color,
			align : _align,
			stroke : glow,
			strokeThickness : px,
			wordWrap : true,
			wordWrapWidth : width
		};
	} else {
		style = {
			font : size + "px " + font,
			fill : color,
			align : _align,
			wordWrap : true,
			wordWrapWidth : width
		};
	}
	
	var obj = new PIXI.Container();
	
	var tfMain = new PIXI.Text(text, style);
	tfMain.y = 0;
	obj.addChild(tfMain);
	if(_align == "left"){
		tfMain.x = 0;
	} else if(_align == "right"){
		tfMain.x = -tfMain.width;
	} else {
		tfMain.x = - tfMain.width/2;
	}
	
	obj.width = Math.ceil(tfMain.width);
	obj.height = Math.ceil(tfMain.height);
	
	obj.setText = function(value){
		tfMain.text = value;
		if(_align == "left"){
			tfMain.x = 0;
		} else if(_align == "right"){
			tfMain.x = -tfMain.width;
		} else {
			tfMain.x = - tfMain.width/2;
		}
	};
	
	obj.getText = function(){
		return tfMain.text;
	};
	
	return obj;
}
function addGraphic(_x, _y, _w, _h, _color) {
	if(_w){}else{_w = 100;}
	if(_h){}else{_h = 100;}
	if(_color){}else{_color = 0xFF0000;}
	
	var obj = new PIXI.Container();

	var objImg = new PIXI.Graphics();
	objImg.beginFill(_color).drawRect(-_w/2, -_h/2, _w, _h).endFill();
	obj.addChild(objImg);
	
	obj.x = _x;
	obj.y = _y;
	obj.w = _w;
	obj.h = _h;
	
	return obj;
}
function addButtonGr(_name, _x, _y, _title, _w, _h, _sizeTF, _color, _colorOver) {
	if(_x){}else{_x = 0;}
	if(_y){}else{_y = 0;}
	if(_w){}else{_w = 200;}
	if(_h){}else{_h = 70;}
	if(_sizeTF){}else{_sizeTF = 30;}
	if(_color){}else{_color = 0xFFC893;}
	if(_colorOver){}else{_colorOver = 0xFFF7D2;}
	
	var obj = new PIXI.Container();

	var objImg = new PIXI.Graphics();
	objImg.beginFill(_color).drawRect(-_w/2, -_h/2, _w, _h).endFill();
	obj.addChild(objImg);
	obj.over = new PIXI.Graphics();
	obj.over.beginFill(_colorOver).drawRect(-_w/2, -_h/2, _w, _h).endFill();
	obj.over.visible = false;
	obj.addChild(obj.over);
	obj.lock = new PIXI.Graphics();
	obj.lock.beginFill(0x999999).drawRect(-_w/2, -_h/2, _w, _h).endFill();
	obj.lock.visible = false;
	obj.addChild(obj.lock);
	
	if(_title){
		obj.tf = addText(_title, _sizeTF, "#ffffff", "#000000", "center", _w-20, 4);
		obj.tf.x = 0;
		obj.tf.y = -obj.tf.height/2;
		obj.addChild(obj.tf);
	}
	
	obj.sc = 1;
	obj.x = _x;
	obj.y = _y;
	obj.w = _w;
	obj.h = _h;
	obj.r = obj.w/2;
	obj.rr = obj.r*obj.r;
	obj.name = _name;
	obj._selected = false;
	obj._disabled = false;
	obj.interactive = true;
	obj.buttonMode=true;
	if(obj.w < 50){
		obj.w = 50;
	}
	if(obj.h < 50){
		obj.h = 50;
	}
	
	obj.setDisabled = function(value){
		obj._disabled = value;
		obj.lock.visible = value;
	};
	
	return obj;
}
function addButton(name, _x, _y, _scGr, _scaleX, _scaleY) {
	if(_x){}else{_x = 0;}
	if(_y){}else{_y = 0;}
	if(_scGr){}else{_scGr = 1;}
	if(_scaleX){}else{_scaleX = 1;}
	if(_scaleY){}else{_scaleY = 1;}
	var obj = new PIXI.Container();
	
	var objImg = null;
	obj.setImg = function(name){
		objImg = addObj(name);
		obj.img = objImg;
		obj.addChild(objImg);
		obj.over = addObj(name + "Over");
		if(obj.over){
			obj.over.visible = false;
			obj.addChild(obj.over);
		} else {
			obj.over = null;
		}
		
		obj.sc = _scGr;
		obj.scale.x = _scGr*_scaleX;
		obj.scale.y = _scGr*_scaleY;
		obj.vX = _scaleX;
		obj.vY = _scaleY;
		obj.x = _x;
		obj.y = _y;
		obj.w = objImg.width*_scGr;
		obj.h = objImg.height*_scGr;
		obj.r = obj.w/2;
		obj.rr = obj.r*obj.r;
		obj.name = name;
		obj._selected = false;
		obj._disabled = false;
		obj.interactive = true;
		obj.buttonMode=true;
		if(obj.w < 50){
			obj.w = 50;
		}
		if(obj.h < 50){
			obj.h = 50;
		}
	};
	
	obj.setDisabled = function(value){
		obj._disabled = value;
		if(value){
			obj.img.filters = [colorFilter];
		} else {
			obj.img.filters = [];
		}
	};
	
	obj.setAplhaDisabled = function(value){
		obj._disabled = value;
		if(value){
			obj.alpha = 0.5;
		} else {
			obj.alpha = 1;
		}
	};
	
	obj.setImg(name);
	
	return obj;
}
function addButton2(name, _x, _y, _scGr, _scaleX, _scaleY) {
	if(_x){}else{_x = 0;}
	if(_y){}else{_y = 0;}
	if(_scGr){}else{_scGr = 1;}
	if(_scaleX){}else{_scaleX = 1;}
	if(_scaleY){}else{_scaleY = 1;}
	var obj = new PIXI.Container();
	
	var data = preloader.resources[name];
	var objImg = null;
	if(data){
		objImg = new PIXI.Sprite(data.texture);
		objImg.anchor.x = 0.5;
		objImg.anchor.y = 0.5;
		obj.addChild(objImg);
	} else {
		return null;
	}
	
	data = preloader.resources[name + "Over"];
	if(data){
		obj.over = new PIXI.Sprite(data.texture);
		obj.over.anchor.x = 0.5;
		obj.over.anchor.y = 0.5;
		obj.over.visible = false;
		obj.addChild(obj.over);
	} else {
		obj.over = null;
	}
	
	data = preloader.resources[name + "Lock"];
	if(data){
		obj.lock = new PIXI.Sprite(data.texture);
		obj.lock.anchor.x = 0.5;
		obj.lock.anchor.y = 0.5;
		obj.lock.visible = false;
		obj.addChild(obj.lock);
	} else {
		obj.lock = null;
	}
	obj.sc = _scGr;
	obj.scale.x = _scGr*_scaleX;
	obj.scale.y = _scGr*_scaleY;
	obj.vX = _scaleX;
	obj.vY = _scaleY;
	obj.x = _x;
	obj.y = _y;
	obj.w = objImg.width*_scGr;
	obj.h = objImg.height*_scGr;
	obj.r = obj.w/2;
	obj.rr = obj.r*obj.r;
	obj.name = name;
	obj._selected = false;
	obj._disabled = false;
	obj.interactive = true;
	obj.buttonMode=true;
	if(obj.w < 50){
		obj.w = 50;
	}
	if(obj.h < 50){
		obj.h = 50;
	}
	
	return obj;
}

function getText(txt) {
	return language.get_txt(txt);
}
function getXMLDocument(url){  
    var xml;  
	
    if(window.XMLHttpRequest){   
        xml=new XMLHttpRequest();  
        xml.open("GET", url, false);
		try {
			xml.send(null);  
			return xml.responseXML;
		} catch (err) {
			return null;
		}
    } else {
        if(window.ActiveXObject){
            xml=new ActiveXObject("Microsoft.XMLDOM");  
            xml.async=false; 
			try {
				xml.load(url);
			} catch (err) {
				return null;
			}			
            return xml;  
        } else {  
            console.log("Loading XML is not supported by the browser");  
            return null;  
        } 
	}
}

function get_dd(p1, p2) {
	var dx=p2.x-p1.x;
	var dy=p2.y-p1.y;
	return dx*dx+dy*dy;
}
function getDD(x1, y1, x2, y2) {
	var dx = x2 - x1;
	var dy = y2 - y1;
	return dx*dx+dy*dy;
}
function hit_test(mc,rr,tx,ty) {
	var dx = mc.x - tx;
	var dy = mc.y - ty;
	var dd = dx*dx+dy*dy;
	if(dd<rr){
		return true;
	}
	return false;
}
function hit_test_rec(mc, w, h, tx, ty) {
	if(tx>mc.x-w/2 && tx<mc.x+w/2){
		if(ty>mc.y-h/2 && ty<mc.y+h/2){
			return true;
		}
	}
	return false;
}
function numToHex(num) {
	return num.toString(16);
}
function hexToNum(str) {
	return parseInt(str, 16);
}
function pad(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}
function makeID(){
	var count = 64;
	var str = "0x";
	var possible = "abcdef0123456789";
	var t = String(getTimer());
	count -= t.length;
	str += t;

	for( var i=0; i < count; i++ ){
		str += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	
	return str;
}
function copyToClipboard(value) {
	window.prompt("Copy to clipboard: Ctrl+C", value);
}
function getNormalTime(ms){
	if (ms<0) {
		return "00:00";
	}
	var s = Math.round(ms/1000);
	var m = Math.floor(s / 60);
	s = s - m * 60;
	var tS = String(s);
	var tM = String(m);
	
	if (s<10 && s>=0) {
		tS = "0" + String(s);
	}
	if (m<10 && m>=0) {
		tM = "0" + String(m);
	}
	return tM + ":" + tS;
}

function visGame() {
	//play
	options_pause = false;
	// refreshTime();
	
	if(currentScreen){
		if(currentScreen.name == "ScrGame"){
			currentScreen.checkOnline();
		}
	}
}

function hideGame() {
	//pause
	options_pause = true;
	// refreshTime();
}

visibly.onVisible(visGame);
visibly.onHidden(hideGame);


document.addEventListener('DOMContentLoaded', loadLib);