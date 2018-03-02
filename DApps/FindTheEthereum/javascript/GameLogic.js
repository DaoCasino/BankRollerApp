 /**
 * Created by DAO.casino.
 * v 1.0.0
 *
 * @constructor
 * @this {GameLogic}
 *  
 * Define our DApp logic constructor, 
 * for use it in frontend and bankroller side
 */

DCLib.defineDAppLogic('DC_FindTheEthereum_v2017', function(){
	var _self = this;
	
	const MIN_VALUE = 1;
	const MAX_VALUE = 3;
	
	var _session = 0;
	var _addressBankroll = "";
	var _addressPlayer = "";
	var _history = [];
	
	var _objGame = {
		method       : "",
		result       : false,
		play         : false,
		win          : false,
		round  		 : 1,
		countWinStr  : 0,
		valueBankroller : 0,
		valuePlayer  : 0,
		countBox     : 3,
		bufferProfit : 0,
		betGame      : 0
	};
		
	var _arWinSt = [0, 2, 4, 10, 20, 50];
	
	/**
	 * Set the game parameters.
	 *
	 * @param  {string} addressPlayer Player address.
	 * @param  {string} addressBankroll Bankroll address.
	 * @return {boolean} true.
	 */
	_self.initGame = function(addressPlayer, addressBankroll){
		_addressPlayer = addressPlayer;
		_addressBankroll = addressBankroll;
		return true;
	}
	
	/**
	 * Data signing by bankroll.
	 *
	 * @param  {string} idChannel Unique channel id.
	 * @param  {number} session Game session number.
	 * @param  {number} round Round in the gaming session.
	 * @param  {string} seed Unique player seed.
	 * @param  {Object} gameData The object contains data from the player.
	 * @param  {string} gameData.type Data type in an array.
	 * @param  {number[]} gameData.value Array of player values.
	 * @param  {string} signPlayer Player's signature of previous parameters.
	 * @return {Object} signBankroll Returns the signature of the bankroll.
	 */
	_self.signBankroll = function(idChannel, session, round, seed, gameData, signPlayer){
		if(round != _objGame.round){
			return {error: "invalid_round_player"};
		}
		
		var hash = DCLib.web3.utils.soliditySha3(idChannel, session, round, seed, gameData);
		var signBankroll = DCLib.Account.signHash(hash);
		if(!DCLib.checkHashSig(hash, signPlayer, _addressPlayer)){
			return {error: "invalid_signature_player"};
		}
		
		return {
			hash: hash,
			signBankroll: signBankroll
		};
	}
	
	/**
	 * Box selection. The result of the game is calculated. Parameters change.
	 *
	 * @param  {string} idChannel Unique channel id.
	 * @param  {number} session Game session number.
	 * @param  {number} round Round in the gaming session.
	 * @param  {string} seed Unique player seed.
	 * @param  {Object} gameData The object contains data from the player.
	 * @param  {string} gameData.type Data type in an array.
	 * @param  {number[]} gameData.value Array of player values.
	 * @param  {string} signBankroll Bankroll's signature of previous parameters.
	 * @return {Object} objGame Returns the changed game object.
	 */
	_self.clickBox = function(idChannel, session, round, seed, gameData, signBankroll){
		var betGame = DCLib.Utils.dec2bet(gameData.value[0]);
		var countWinStr = gameData.value[1];
		var valPlayer = gameData.value[2];
		var randomHash = DCLib.web3.utils.soliditySha3(idChannel, session, round, seed, gameData);

		if(!DCLib.checkHashSig(randomHash, signBankroll, _addressBankroll)){
			return {error: "invalid_signature_bankroll"};
		}
		
		if(countWinStr >= _arWinSt.length || 
		countWinStr < 0 ||
		valPlayer < MIN_VALUE ||
		valPlayer > MAX_VALUE){
			return {error : "invalid_data"};
		}
		
		// new game
		var objHistory = {balance:0, profit:0, countWinStr:0};
		if(betGame > 0){
			_session ++;
			_self.payChannel.addTX(-betGame);
			_objGame.betGame = betGame;
			_objGame.round = 1;
			_objGame.countWinStr = 0;
			_objGame.bufferProfit = 0;
			_objGame.result = false;
			_objGame.play = false;
			_history.push(objHistory);
		} else {
			_objGame.round ++;
			objHistory = _history[_session-1];
		}
		
		_objGame.method = "clickBox";
		_objGame.valueBankroller = DCLib.numFromHash(signBankroll, 1, _objGame.countBox);
		_objGame.valuePlayer = valPlayer;
		_objGame.win = false;
		
		if(_objGame.valuePlayer == _objGame.valueBankroller){
			_objGame.countWinStr ++;
			_objGame.win = true;
			if(_objGame.countWinStr >= _arWinSt.length-1){
				_objGame.result = true;
			}
		} else {
			_objGame.countWinStr = 0;
			_objGame.result = true;
		}
		
		_objGame.bufferProfit = _objGame.betGame * _arWinSt[_objGame.countWinStr];
		
		for(var tag in _objGame){
			if(tag == "countWinStr"){
				if(_objGame[tag] > 0){
					objHistory[tag] = _objGame[tag];
				}
			}else{
				objHistory[tag] = _objGame[tag];
			}
		}
		
		// game over
		if(_objGame.result){
			_self.closeGame();
		}
		
		objHistory.balance = _self.payChannel.getBalance();
		objHistory.profit =_objGame.bufferProfit - _objGame.betGame;
		
		// sign result game
		gameData = {type:'uint', value:[DCLib.Utils.bet2dec(betGame), _objGame.countWinStr, valPlayer]};
		randomHash = DCLib.web3.utils.soliditySha3(idChannel, _session, _objGame.round, seed, gameData);
		var signStateBankroll = DCLib.Account.signHash(randomHash);
		
		return {
			objGame: _objGame,
			balance: _self.payChannel.getBalance(),
			signBankroll: signBankroll,
			signStateBankroll: signStateBankroll,
			history: _history,
			timestamp: new Date().getTime()
		};
	}
	
	/**
	 * Closes the game session.
	 *
	 * @return {Object} objGame Returns the changed game object.
	 */
	_self.closeGame = function(){
		var countWinStr = _objGame.countWinStr;
		_objGame.method = "closeGame";
		_objGame.result = true;
		_objGame.play = false;
		
		_objGame.countWinStr = 0;
		_self.payChannel.addTX(_objGame.bufferProfit);
		var objHistory = _history[_session-1];
		objHistory.balance = _self.payChannel.getBalance();
		objHistory.profit =_objGame.bufferProfit - _objGame.betGame;
		_history[_session-1] = objHistory;
		 _objGame.betGame = 0;
		
		return {
			objGame 	: _objGame,
			countWinStr : countWinStr,
			history		: _history,
			balance     : _self.payChannel.getBalance(),
			timestamp   : new Date().getTime()
		};
	}
	
	/**
	 * Returns a game object.
	 *
	 * @return {Object} objGame Returns a game object.
	 */
	_self.getGame = function(){
		return _objGame;
	}
	
	/**
	 * Returns the player's balance.
	 *
	 * @return {number} Returns the player's balance.
	 */
	_self.getBalance = function(){
		return _self.payChannel.getBalance();
	}
	
	/**
	 * Returns an array of game history.
	 *
	 * @return {array} Returns an array of game history.
	 */
	_self.getHistory = function(){
		return _history;
	}
	
	/**
	 * Returns the session number of the game.
	 *
	 * @return {number} Returns the session number of the game.
	 */
	_self.session = function(){
		return _session;
	}
	
	_self.loadGame = function(objGame, hist, session){
		// only for player
		if(_addressBankroll == "" || _addressBankroll == DCLib.Account.get().openkey){
			return;
		}
		_objGame = objGame;
		_history = hist;
		_session = session;
	}
	
	return _self;
})
