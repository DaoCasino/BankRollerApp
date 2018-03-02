function daoLang(value) {
	PIXI.Container.call( this );
	this.init();
}

daoLang.prototype = Object.create(PIXI.Container.prototype);
daoLang.prototype.constructor = daoLang;
	
var daoLang = function() {
	this.init();
}

daoLang.prototype.init = function() {
	this.daoLangObj = null;
	this.current_id = null;
	
	this.langs_list = [];
	this.langs_obj = [];
	
	this.daoLang_names = {};
	this.daoLang_names.en="English";
	this.daoLang_names.es="Espanol";
	this.daoLang_names.ru="Russian";
	this.daoLang_names.jp="Japanese";
	
	this.en_xml = getXMLDocument("data/lang_en.xml");
	if(this.en_xml){
		this.daoLangObjEn = this.en_xml.childNodes[0];
	}
}

daoLang.prototype.saveSettings = function(){
	var settings = {};
	settings.current_id = this.current_id;
}

daoLang.prototype.loadSettings = function(){
	this.setLanguage('en');
	return;
}

daoLang.prototype.add_lang_xml = function(id, fontName){
	var lang_obj = {};
	lang_obj.id = id;
	lang_obj.font=fontName;
	this.langs_list.push(lang_obj);
	this.langs_obj[id] = lang_obj;
}

daoLang.prototype.getList = function (){
	return this.langs_list;
}

daoLang.prototype.setLanguage = function (id){
	var obj=this.langs_obj[id];
	if(obj.font){
		if(setMainFont){
			setMainFont(obj.font);
		}
	}
	var xml = getXMLDocument("data/lang_"+id+".xml");
	if(xml){
		this.daoLangObj = xml.childNodes[0];
		this.current_id = id;
		
		this.saveSettings();
	}
}

daoLang.prototype.get_txt = function (txt){
	if(this.daoLangObj == null){
		return txt;
	}
	
	if(this.daoLangObj.getAttribute(txt) == null){
		if(this.daoLangObjEn == null){
			return txt;
		}
		if(this.daoLangObjEn.getAttribute(txt) == null){
			return txt;
		} else {
			return this.daoLangObjEn.getAttribute(txt);
		}
	} else {
		return this.daoLangObj.getAttribute(txt);
	}
}

daoLang.prototype.get_bol = function (txt){
	return (this.daoLangObj.getAttribute(txt) != null)
}