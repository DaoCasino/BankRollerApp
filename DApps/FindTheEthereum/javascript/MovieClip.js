function MovieClip() {
	PIXI.Container.call( this );
	this.init();
}

MovieClip.prototype = Object.create(PIXI.Container.prototype);
MovieClip.prototype.constructor = MovieClip;

MovieClip.prototype.init = function() {
	this.a, this.zone, this.it, this.sh;
	this.energy, this.energymax, this.wid, this.hei, this.hwid, this.hhei, this.d;
	this.act, this.actnow;
	this.z = {};
	
	// create empty MovieClip 'a' if not available
	if (!this.a){
		this.a = new PIXI.Container()
		this.addChild(this.a);
	}
	this.energy = this.energymax = 100
	this.setsize(0, 0)
	this.z = {}
	this.zone ? (this.zone.visible = false) : (undefined);
	this.added();
}

// show act
MovieClip.prototype.showact = function() {
	if(this.act != this.actnow){
		this.actnow = this.act;
	}
}

// set size
MovieClip.prototype.setsize = function(ww, hh) {
	this.wid = ww;
	this.hei = hh;
	this.hwid = this.wid / 2;
	this.hhei = this.hei / 2;
}

// set zone (based on parent's coordinates)
MovieClip.prototype.setzone = function(xx, yy, wid, hei, draw) {
	this.z.x = this.x + xx
	this.z.y = this.y + yy
	this.zone.x = xx
	this.zone.y = yy
	this.z.width = this.zone.width = this.wid
	this.z.height = this.zone.height = this.hei
	draw ? (this.zone.visible = true) : (undefined)
}

// added
MovieClip.prototype.added = function() {
	this.setlisteners()
}

// loop
MovieClip.prototype.loop = function() {
}

// removed
MovieClip.prototype.removed = function() {
}

// cek die
MovieClip.prototype.cekdie = function() {
	!this.energy ? (this.die()) : (undefined)
}

// add shadow
MovieClip.prototype.addshadow = function(nama) {
}

// update shadow
MovieClip.prototype.updateshadow = function() {
	sh.x = x
	sh.y = y
}

// set listeners
MovieClip.prototype.setlisteners = function() {
}

// enter_frame
MovieClip.prototype.enter_frame = function() {
	!options_pause ? (this.loop()) : (undefined)
}

// removed_from_stage
MovieClip.prototype.removed_from_stage = function() {
	this.removed()
	this.clearlistener()
	this.sh ? (this.sh.parent.removeChild(this.sh)) : (undefined) // remove shadow
}

MovieClip.prototype.removevalue = function(value, arr){
	for (var i = 0; i < arr.length; i++){
		arr[i] == value ? (arr = arr.splice(i, 1)) : (undefined);
	}
}

// clear listener
MovieClip.prototype.clearlistener = function() {
}

// die
MovieClip.prototype.die = function() {
	this.removevalue(this, arClips);
	if (this.parent){
		this.parent.removeChild(this)
	}
}