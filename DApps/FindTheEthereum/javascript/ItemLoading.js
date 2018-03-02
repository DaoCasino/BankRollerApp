/**
 * Created by DAO.casino
 * Treasure Of DAO - ItemLoading
 * v 1.0.0
 */

/*eslint no-undef: "none"*/

var ItemLoading = function(){
	PIXI.Container.call( this );
	
	const TIME_STEP = 150;
	
	var _self = this;
	var _arCircles = [];
	var _timeStep = 0;
	var _num = 0;
	var _pointLight
	
	_self.init = function() {
		var w = 200;
		var count = 6;
		var step = w/count;
		
		for (var i = 0; i < 6; i++) {
			var circle = addObj("pointDark");
			circle.x = - w/2 + step*i;
			_self.addChild(circle);
			_arCircles.push(circle);
		}
		
		_pointLight = addObj("pointLight");
		_pointLight.x = - w/2;
		_self.addChild(_pointLight);
	}

	_self.update = function(diffTime) {
		_timeStep += diffTime;
		if(_timeStep > TIME_STEP){
			_timeStep = 0;
			var prevNum = _num - 1;
			if(prevNum < 0){
				prevNum = _arCircles.length-1;
			}
			var circle = _arCircles[_num];
			_pointLight.x = circle.x;
			
			_num ++;
			if(_num >= _arCircles.length){
				_num = 0;
			}
		}
	}

	_self.init();
	
	return _self;
};

ItemLoading.prototype = Object.create(PIXI.Container.prototype);
ItemLoading.prototype.constructor = ItemLoading;
