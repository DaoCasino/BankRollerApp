function ItemResult(value, _x, _y, delay) {
	PIXI.Container.call( this );
	this.init(value, _x, _y, delay);
}

ItemResult.prototype = new MovieClip();


ItemResult.prototype.init = function(value, _x, _y, delay) {
	if(delay){}else{delay=60}
	this.a = new PIXI.Container();
	this.addChild(this.a);
	
	var str = getText("lose");
	var color = "#FFFFFF";
	if(value){
		str = getText("win");
		color = "#ED9829";
	}
	var tf = addText(str, 70, color, "#0000000", "center", 300, 4);
	this.a.addChild(tf);
	
	this.d = delay
	this.alpha = 0
	this.x = _x;
	this.y = _y;
	this.yy = _y - 50;
	
	arClips.push(this);
}

ItemResult.prototype.loop = function() {
	if(this.d > 10){
		this.y = this.y + (this.yy - this.y) / 4;
		this.alpha = Math.min(1, this.alpha + 0.1)
	} else {
		this.y -= 3;
		this.alpha = Math.max(0, this.alpha - 0.1)
	}
	this.d--, !this.d ? (this.die()) : (undefined);
}