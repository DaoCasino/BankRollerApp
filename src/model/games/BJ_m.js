/**
 * Created by DAO.casino
 * BlackJack
 * v 1.0.0
 */

var RoomJS = function(){
	var _self     = this
	var _Users    = {}
	var _maxUsers = 3

	_self.addUser = function(address, deposit, id, callback){
		var params = {prnt:_self, balance:deposit, address:address, callback:callback, bMultiplayer:true}

		var logic = new LogicMultJS(params)

		if (!id) {
			id = Object.keys(_Users).length
		}

		var user = {
			address: address,
			deposit: deposit,
			logic:   logic,
			id:      id
		}

		if (!_Users[address]) {
			_Users[address] = user
		}

		_Users[address].callback = callback

		return user
	}

	_self.editUser = function(address, key, val){
		_Users[address][key] = val
	}


	_self.callFunction = function(address, name, params){
		_Users[address].logic[name].apply(null, params)
	}

	_self.getUsers = function(){
		return _Users
	}
	_self.getUsersArr = function(){
		return Object.values( _Users )
	}

	_self.getTagUser = function(address){
		return _Users[address]
	}

	_self.getMaxUsers = function(){
		return _maxUsers
	}
	_self.full = function(){
		return (Object.values( _Users ).length >= _maxUsers)
	}

	return _self
}


/**
 * Created by DAO.casino
 * BlackJack
 * v 1.0.7
 */

var LogicMultJS = function(params){
	var _self = this

	var BLACKJACK = 21

	var DEAL = 0
	var HIT = 1
	var STAND = 2
	var SPLIT = 3
	var DOUBLE = 4
	var INSURANCE = 5

	var COUNT_DECKS = 4
	var COUNT_CARDS = 52

	var _address = '0x'

	var _money = 0
	var _balance = 0
	var _myPoints = 0
	var _splitPoints = 0
	var _housePoints = 0
	var _idGame = 0

	var _arMyCards = []
	var _arMySplitCards = []
	var _arHouseCards = []
	var _arMyPoints = []
	var _arMySplitPoints = []
	var _arHousePoints = []
	var _arDecks = []
	var _arCards = []

	var _bStand = false
	var _bStandNecessary = false
	var _bSplit = false
	var _bMultiplayer = false
	var _bDealerStart = false
	var _bDealerEnd = false

	var _prnt
	var _callback

	if(params){
		if(params.prnt){
			_prnt = params.prnt
		}
		if(params.address){
			_address = params.address
		}
		if(params.callback){
			_callback = params.callback
		}

		_bMultiplayer = params.bMultiplayer || false

		_balance = params.balance || 0
	}

	var _objSpeedGame = {method:'',
		result:false,
		play:false,
		idGame:-1,
		curGame:{},
		betGame:0,
		betSplitGame:0,
		money:_money,
		insurance:false}
	var _objResult = {main:'', split:'', betMain:0, betSplit:0, profit:0, mixing:false}

	mixDeck()

	// single methods
	_self.bjDeal = function(_s, _bet){
		_objSpeedGame.method = 'bjDeal'
		_idGame ++
		_objResult = {main:'', split:'', betMain:0, betSplit:0, profit:-_bet, mixing:false}
		_objSpeedGame.result = false
		_objSpeedGame.play   = true
		_objSpeedGame.curGame = {}
		_objSpeedGame.betGame = _bet
		_objSpeedGame.betSplitGame = 0
		_money -= _bet
		_objSpeedGame.money = _money
		_objSpeedGame.insurance = false
		_arMyCards = []
		_arMySplitCards = []
		_arHouseCards = []
		_arMyPoints = []
		_arMySplitPoints = []
		_arHousePoints = []
		_bStand = false
		_bStandNecessary = false
		_bSplit = false

		dealCard(true, true, _s, 15)
		dealCard(false, true, _s, 16)
		dealCard(true, true, _s, 17)
		refreshGame(_s)
	}

	_self.bjHit = function(_s, isMain){
		_objSpeedGame.method = 'bjHit'
		dealCard(true, isMain, _s)
		refreshGame(_s)
	}

	_self.bjStand = function(_s, isMain){
		_objSpeedGame.method = 'bjStand'
		stand(isMain, _s)
		refreshGame(_s)
	}

	_self.bjSplit = function(_s){
		_objSpeedGame.method = 'bjSplit'
		_arMySplitCards = [_arMyCards[1]]
		_arMyCards = [_arMyCards[0]]
		_arMySplitPoints = [_arMyPoints[0]]
		_arMyPoints = [_arMyPoints[0]]
		_myPoints = getMyPoints()
		_splitPoints = getMySplitPoints()
		_bSplit = true
		dealCard(true, true, _s, 15)
		dealCard(true, false, _s, 16)
		_objSpeedGame.betSplitGame = _objSpeedGame.betGame
		_money -= _objSpeedGame.betSplitGame
		_objSpeedGame.money = _money
		_objResult.profit -= _objSpeedGame.betSplitGame
		refreshGame(_s)
	}

	_self.bjDouble = function(_s, isMain){
		_objSpeedGame.method = 'bjDouble'
		dealCard(true, isMain, _s)
		stand(isMain, _s)
		if(isMain){
			_money -= _objSpeedGame.betGame
			_objResult.profit -= _objSpeedGame.betGame
			_objSpeedGame.betGame *= 2
		} else {
			_money -= _objSpeedGame.betSplitGame
			_objResult.profit -= _objSpeedGame.betSplitGame
			_objSpeedGame.betSplitGame *= 2
		}
		_objSpeedGame.money = _money
		refreshGame(_s)
	}

	_self.bjInsurance = function(_bet){
		_objSpeedGame.method = 'bjInsurance'
		_objSpeedGame.insurance = true
		_money -= _bet
		_objSpeedGame.money = _money
		_objResult.profit -= _bet
	}

	// multiplayer methods
	_self.bjBet = function(_bet){
		_idGame ++
		_objResult = {main:'', split:'', betMain:0, betSplit:0, profit:-_bet, mixing:false}

		_objSpeedGame.method       = 'bjBet'
		_objSpeedGame.result       = false
		_objSpeedGame.curGame      = {}
		_objSpeedGame.betGame      = _bet
		_objSpeedGame.betSplitGame = 0

		_money -= _bet

		_objSpeedGame.money     = _money
		_objSpeedGame.insurance = false

		_arMyCards       = []
		_arMySplitCards  = []
		_arHouseCards    = []
		_arMyPoints      = []
		_arMySplitPoints = []
		_arHousePoints   = []

		_bStand          = false
		_bStandNecessary = false
		_bSplit          = false

		if(typeof _callback === 'function'){
			_callback(_address, _objSpeedGame)
		}
	}

	_self.bjDealer = function(_s){
		if (_bDealerStart) return
		_bDealerStart = true
		_bDealerEnd = false
		_objSpeedGame.play   = true
		_objSpeedGame.method = 'bjDealer'
		dealCard(false, true, _s)
		refreshGame(_s)
	}

	_self.bjDealerStand = function(_s, isMain){
		if (_bDealerEnd) return
		_bDealerStart = false
		_bDealerEnd = true

		_objSpeedGame.method = 'bjDealerStand'
		_bStand = true

		var val = 15
		while (_housePoints < 17 && val < 32) {
			dealCard(false, true, _s, val)
			console.log('bjDealerStand - dealCard', _housePoints)
			val += 1
		}
		refreshGame(_s)
	}

	_self.bjMultStand = function(_s, isMain){
		_objSpeedGame.method = 'bjMultStand'

		_bSplit = false
		if (!isMain) {
			return
		}
		_bStand = true

		if(typeof _callback === 'function'){
			_callback(_address, _objSpeedGame)
		}
	}

	_self.bjMultDouble = function(_s, isMain){
		_objSpeedGame.method = 'bjMultDouble'
		dealCard(true, isMain, _s)

		if(isMain){
			_bStand = true
			_money -= _objSpeedGame.betGame
			_objResult.profit -= _objSpeedGame.betGame
			_objSpeedGame.betGame *= 2
		} else {
			_bSplit = false
			_money -= _objSpeedGame.betSplitGame
			_objResult.profit -= _objSpeedGame.betSplitGame
			_objSpeedGame.betSplitGame *= 2
		}
		_objSpeedGame.money = _money
		refreshGame(_s)
	}

	// get methods
	_self.makeID = function(){
		var count = 64
		var str = '0x'
		var possible = 'abcdef0123456789'
		var t = String(getTimer())
		count -= t.length
		str += t

		for( var i=0; i < count; i++ ){
			str += possible.charAt(Math.floor(Math.random() * possible.length))
		}

		str = '0x' + web3_sha3(numToHex(str))

		return str
	}

	_self.getGame = function(){
		return _objSpeedGame
	}

	_self.getResult = function(){
		return _objResult
	}

	_self.getBalance = function(){
		var balance = _balance + _money
		return balance
	}

	_self.getValCards = function(cardIndex){
		var cardType = Math.floor(cardIndex / 4)
		var cardSymbol = String(cardType)
		var s = cardIndex % 4 + 1
		var suit = ''
		switch (cardType) {
		case 0:
			cardSymbol = 'K'
			break
		case 1:
			cardSymbol = 'A'
			break
		case 11:
			cardSymbol = 'J'
			break
		case 12:
			cardSymbol = 'Q'
			break
		}

		var spriteName = cardSymbol
		return spriteName
	}

	_self.refreshGame = function(_s){
		refreshGame(_s)
	}

	function mixDeck(){
		_arCards = []
		_objResult.mixing = true

		for(var i=0; i<52; i++){
			_arDecks[i] = 0
		}
	}

	function refreshGame(_s){
		checkResult(true, _s)
		if(_arMySplitCards.length > 0){
			checkResult(false, _s)
		}

		_objSpeedGame.money = _money
		_objSpeedGame.curGame = {'arMyCards':_arMyCards,
			'arMySplitCards':_arMySplitCards,
			'arHouseCards':_arHouseCards}

		if(typeof _callback === 'function'){
			_callback(_address, _objSpeedGame)
		}

		if(_objSpeedGame.result){
			// console.log("Game Over", _objResult.profit, _money);
			var prcnt = Math.ceil(COUNT_DECKS*COUNT_CARDS*0.25)
			if(_arCards.length > prcnt){
				mixDeck()
			}
		}
	}

	function stand(isMain, _s){
		_bSplit = false
		if (!isMain) {
			return
		}
		_bStand = true

		if(_myPoints > BLACKJACK &&
		(_arMySplitCards.length == 0 ||
		_splitPoints > BLACKJACK)){
			dealCard(false, true, _s, 15)
		} else {
			var val = 15
			while (_housePoints < 17 && val < 32) {
				dealCard(false, true, _s, val)
				val += 1
			}
		}
	}

	function dealCard(player, isMain, seed, val){
		var newCard = createCard(seed, val)

		var cardType = Math.floor(newCard / 4)
		var point = cardType

		switch (cardType) {
		case 0:
		case 11:
		case 12:
			point = 10
			break
		case 1:
			point = 11
			break
		}

		if(player){
			if (isMain) {
				_arMyPoints.push(point)
				_myPoints = getMyPoints()
				_arMyCards.push(newCard)
				// console.log("dealClient: Main", newCard, getNameCard(newCard));
				if(_myPoints >= BLACKJACK && !_bSplit){
					if(_bMultiplayer){
						_bStand = true
					} else {
						stand(isMain, seed)
					}
				}
			} else {
				_arMySplitPoints.push(point)
				_splitPoints = getMySplitPoints()
				_arMySplitCards.push(newCard)
				// console.log("dealClient: Split", newCard, getNameCard(newCard));
			}
		} else {
			_arHousePoints.push(point)
			_housePoints = getHousePoints()
			_arHouseCards.push(newCard)
			// console.log("dealClient: House", newCard, getNameCard(newCard));
		}
	}

	function checkResult(isMain, _s){
		if(_arHouseCards.length < 2){
			return false
		}
		var points = getMySplitPoints()
		var bet = _objSpeedGame.betSplitGame
		var betWin = 0
		var countCard = _arMySplitCards.length
		var state = ''

		if(isMain){
			countCard = _arMyCards.length
			points = getMyPoints()
			bet = _objSpeedGame.betGame

			if(_objSpeedGame.result){
				return false
			}
		}

		if(points == BLACKJACK && _housePoints == BLACKJACK && state==''){
			state = 'push'
			betWin = bet
			if(isMain && !_bSplit){
				_objSpeedGame.result = true
			}
		}
		if (_housePoints == BLACKJACK && points != BLACKJACK && state=='') {
			state = 'lose'
			if(isMain){
				_objSpeedGame.result = true
				if(_objSpeedGame.insurance){
					betWin = bet
				}
			}
		}

		if (points == BLACKJACK && state=='') {
			if(countCard == 2){
				state = 'blackjack'
				bet = bet * 2.5
				betWin = bet
			}
			if(isMain){
				if(!_bSplit){
					_objSpeedGame.result = true
				}
			} else {
				_bSplit = false
			}
		}
		if (points > BLACKJACK && state=='') {
			state = 'bust'
			if(isMain){
				if(!_bSplit){
					_objSpeedGame.result = true
				}
			} else {
				_bSplit = false
			}
		}
		if (points == _housePoints && state=='') {
			state = 'push'
			betWin = bet
		}
		if (points < _housePoints && _housePoints <= BLACKJACK && state=='') {
			state = 'lose'
		}

		if (state=='') {
			state = 'win'
			bet = bet * 2
			betWin = bet
		}

		if(!_objSpeedGame.result && isMain){
			if(_bStand){
				_objSpeedGame.result = true
			} else if(points == BLACKJACK && !_bSplit){
				if(_bStandNecessary){
					_objSpeedGame.result = true
				} else {
					_bStandNecessary = true
					if(_bMultiplayer){
						_self.bjMultStand(_s, isMain)
					} else {
						_self.bjStand(_s, isMain)
					}
					return false
				}
			}
		}

		if(_objSpeedGame.result){
			_objSpeedGame.play = false

			_money += betWin
			_objSpeedGame.money = _money
			_objResult.profit += betWin
			if(isMain){
				_objResult.main = state
				_objResult.betMain = betWin
				// console.log("result: Main", state, "_money = "+betWin);
			} else {
				_objResult.split = state
				_objResult.betSplit = betWin
				// console.log("result: Split", state, "_money = "+betWin);
			}
		}
	}

	function checkCard(rand){
		if(_arCards.length > 40){
			mixDeck()
		}

		if(_arDecks[rand] < COUNT_DECKS){
		} else {
			for(var i=0; i<52; i++){
				if(_arDecks[i] < COUNT_DECKS){
					rand = i
					break
				}
			}
		}

		return rand
	}

	function createCard(cardNumber, val){
		var hash = ABI.soliditySHA3(['bytes32'],[ cardNumber ])
		if(val != undefined){
			hash = [hash[val]]
		}
		var rand = bigInt(hash.toString('hex'),16).divmod(52).remainder.value
		rand = checkCard(rand)
		_arCards.push(rand)
		return rand
	}

	function getPoint(id){
		var cardType = Math.floor(id / 4)
		var point = cardType

		switch (cardType) {
		case 0:
		case 11:
		case 12:
			point = 10
			break
		case 1:
			point = 11
			break
		}

		return point
	}

	function getMyPoints(){
		var myPoints = 0
		var countAce = 0
		for (var i = 0; i < _arMyPoints.length; i++) {
			var curPoint = _arMyPoints[i]
			myPoints += curPoint
			if(curPoint == 11){
				countAce ++
			}
		}
		while(myPoints > 21 && countAce > 0){
			countAce --
			myPoints -= 10
		}

		return myPoints
	}

	_self.getMyPoints = getMyPoints

	function getMySplitPoints(){
		var mySplitPoints = 0
		var countAce = 0
		for (var i = 0; i < _arMySplitPoints.length; i++) {
			var curPoint = _arMySplitPoints[i]
			mySplitPoints += curPoint
			if(curPoint == 11){
				countAce ++
			}
		}

		while(mySplitPoints > 21 && countAce > 0){
			countAce --
			mySplitPoints -= 10
		}

		return mySplitPoints
	}

	function getHousePoints(){
		var housePoints = 0
		var countAce = 0
		for (var i = 0; i < _arHousePoints.length; i++) {
			var curPoint = _arHousePoints[i]
			housePoints += curPoint
			if(curPoint == 11){
				countAce ++
			}
		}

		while(housePoints > 21 && countAce > 0){
			countAce --
			housePoints -= 10
		}

		return housePoints
	}

	function getNameCard(cardIndex){
		var cardType = Math.floor(cardIndex / 4)
		var cardSymbol = String(cardType)
		var s = cardIndex % 4 + 1
		var suit = ''
		switch (cardType) {
		case 0:
			cardSymbol = 'K'
			break
		case 1:
			cardSymbol = 'A'
			break
		case 11:
			cardSymbol = 'J'
			break
		case 12:
			cardSymbol = 'Q'
			break
		}
		switch (s) {
		case 1:
			suit = 'Hearts'
			break
		case 2:
			suit = 'Diamonds'
			break
		case 3:
			suit = 'Spades'
			break
		case 4:
			suit = 'Clubs'
			break
		}

		var spriteName = suit + '_' + cardSymbol
		return spriteName
	}

	function getTimer(){
		var d = new Date()
		var n = d.getTime()
		return n
	}

	// only for client
	_self.loadGame = function(game, result){
		_objSpeedGame = game
		_objResult = result
		_money = _objSpeedGame.money

		_arMyCards = _objSpeedGame.curGame.arMyCards || []
		_arMySplitCards = _objSpeedGame.curGame.arMySplitCards || []
		_arHouseCards = _objSpeedGame.curGame.arHouseCards || []
		_arMyPoints = []
		_arMySplitPoints = []
		_arHousePoints = []

		for (var i = 0; i < _arMyCards.length; i++) {
			var point = getPoint(_arMyCards[i])
			_arMyPoints.push(point)
		}
		for (var i = 0; i < _arMySplitCards.length; i++) {
			var point = getPoint(_arMySplitCards[i])
			_arMySplitPoints.push(point)
		}
		for (var i = 0; i < _arHouseCards.length; i++) {
			var point = getPoint(_arHouseCards[i])
			_arHousePoints.push(point)
		}
	}

	_self.setDealerCards  = function(arHouseCards, value){
		_arHouseCards = arHouseCards || []
		_objSpeedGame.curGame.arHouseCards = _arHouseCards
		_arHousePoints = []
		for (var i = 0; i < _arHouseCards.length; i++) {
			var point = getPoint(_arHouseCards[i])
			_arHousePoints.push(point)
		}
		_housePoints = getHousePoints()

		if(value){
			_bStand = true
		}
	}

	return _self
}



const game_code = 'BJ_m'

import ABI        from 'ethereumjs-abi'
import bigInt     from 'big-integer'
import Eth        from 'Eth/Eth'
import Rtc        from 'rtc'
import Channel    from 'Channel'
import GamesStat  from 'games.stat.js'

import * as Utils from 'utils'


const max_players = 3
let Games = []
let _closing_channels = []

export default class BJgame {
	constructor(contractAddress=false) {
		if (!contractAddress) {
			return false
		}

		this.contractAddress = contractAddress

		Eth.Wallet.getPwDerivedKey( PwDerivedKey => {
			this.PwDerivedKey = PwDerivedKey
		})

		this.Games = Games

		if (process.env.NODE_ENV !== 'server') {
			setTimeout(()=>{
				this.startMesh()
			}, 3000)
		}
	}

	startMesh(){
		let user_id = Eth.Wallet.get().openkey || false

		console.log('new RTC', user_id, this.contractAddress)
		this.RTC = new Rtc(user_id, this.contractAddress)

		this.RTC.subscribe(this.contractAddress, data => {
			if (!data || !data.action || !data.game_code || data.game_code!=game_code) { return }

			if (data.action=='get_random') {
				this.sendRandom(data)
				return
			}

			if (data.action=='open_game_channel') {
				this.startGame(data)
				return
			}
			if (data.action=='close_game_channel') {
				console.log('')
				console.log('')
				console.log('Close channel event')
				console.log(data)
				this.endGame(data)
				return
			}


			if (!data.game_id || !data.user_id) { return }

			if (data.action=='call_game_function') {
				this.callGameFunction(data.user_id, data.game_id, data.name, data.args)
			}
		})
	}

	startGame(params){
		if (!params.user_id) {
			return
		}

		let room_hash = false
		for(let k in Games){
			if (Games[k].getUsersArr().length < max_players) {
				room_hash = k
				break
			}
		}

		console.log('startGame')
		console.log('room_hash', room_hash)

		if (!room_hash) {
			room_hash = Utils.makeSeed()
			Games[room_hash] = new RoomJS()
		}

		console.log('addUser', params)
		Games[room_hash].addUser(
			params.user_id,
			params.deposit,
		)

		// Записываем канал пользователя
		if (!Games[room_hash].channels) {
			Games[room_hash].channels = {}
		}
		Games[room_hash].channels[params.user_id] = {
			id:   params.channel_id,
			open: true
		}


		this.RTC.send({
			action:    'user_connected',
			game_code: game_code,
			room_hash: room_hash,
			address:   this.contractAddress,
			user:      {address:params.user_id, deposit:params.deposit},
		})

		this.sendRoomUsers(room_hash)


		Games[room_hash].state = 'wait_players'
		if (Games[room_hash].getUsersArr().length >= 0) {
			Games[room_hash].state = 'wait_players_bets'
		}

		GamesStat.cnt(this.contractAddress, 'open_game')
		GamesStat.add(this.contractAddress, 'players_now', Games[room_hash].getUsersArr().length)
		// GamesStat.add(this.contractAddress, 'players', send_users)
	}

	sendRoomUsers(room_hash, t=100){

		clearTimeout(this.sendRoomUsersT)
		this.sendRoomUsersT = setTimeout(()=>{
			let users = Games[room_hash].getUsersArr()
			let send_users = []
			for(let k in users){
				send_users.push({
					address   : users[k].address,
					deposit   : users[k].deposit,
					id        : users[k].id,

					// игрок начал играть
					play      : users[k].logic.getGame().play,
				})
			}

			this.RTC.send({
				action:    'room_users',
				game_code: game_code,
				room_hash: room_hash,
				address:   this.contractAddress,
				users:     send_users,
			})
			this.sendRoomUsers(room_hash, 2500)
		}, t)

	}

	getUserRoom(user_id){
		for(let room_hash in Games){
			if (Games[room_hash].getUsers()[user_id]) {
				return room_hash
			}
		}
	}
	getUser(user_id){
		for(let room_hash in Games){
			if (Games[room_hash].getUsers()[user_id]) {
				return Games[room_hash].getUsers()[user_id]
			}
		}
	}

	callGameFunction(user_id, game_id, function_name, function_args){
		let user = this.getUser(user_id)
		if (!user) {
			return
		}

		function_args = this.prepareArgs(function_args)

		if (!user.logic[function_name]) {
			return
		}

		if (function_args) {
			user.logic[function_name].apply(null, function_args)
		} else {
			user.logic[function_name]()
		}


		if (['bjDealer', 'bjDealerStand'].indexOf(function_name)!=-1) {
			console.log(function_name, ' - setDealerCards')
			let room = Games[ this.getUserRoom(user_id) ]
			room.getUsersArr().forEach( function(u) {
				u.logic.setDealerCards( user.logic.getGame().curGame.arHouseCards , (function_name=='bjDealerStand'))
			})
		}

		Games[this.getUserRoom(user_id)].state = ''+function_name
	}

	prepareArgs(args){
		if (!args || !args.length) {
			return false
		}

		let new_args = []
		args.forEach( arg => {
			if (arg && (''+arg).indexOf('confirm')!=-1) {
				let seed = arg.split('confirm(')[1].split(')')[0]
				arg = this.confirm(seed)
			}
			new_args.push(arg)
		})
		return new_args
	}

	sendRandom(data){
		if (!data.seed) {
			return
		}

		this.RTC.send({
			action:    'send_random',
			game_code: game_code,
			address:   this.contractAddress,
			seed:      data.seed,
			random:    this.confirm(data.seed),
		})
	}

	confirm(rawMsg=false){
		if (!rawMsg) {
			return
		}

		// let VRS = Eth.Wallet.lib.signing.signMsgHash(
		let VRS = Eth.Wallet.lib.signing.signMsg(
			Eth.Wallet.getKs(),
			this.PwDerivedKey,
			rawMsg,
			Eth.Wallet.get().openkey
		)

		let signature = Eth.Wallet.lib.signing.concatSig(VRS)

		// let v = Utils.hexToNum(signature.slice(130, 132)) // 27 or 28
		// let r = signature.slice(0, 66)
		// let s = '0x' + signature.slice(66, 130)

		// let myopenkey = Eth.Wallet.lib.recoverAddress(rawMsg, v, r, s)


		return signature
	}

	getViewData(){
		let data = {}

		for(let room_hash in Games){
			data[room_hash] = {
				state:     Games[room_hash].state,
				room_hash: room_hash,
				users:     {}
			}

			let users = Games[room_hash].getUsers()
			for(let id in users){
				let g = users[id].logic.getGame().curGame
				let house = '', my = ''
				if (g && g.arHouseCards) {
					house = g.arHouseCards.join('|')
				}
				if (g && g.arMyCards) {
					my = g.arMyCards.join('|')
				}

				data[room_hash].users[id] = {
					balance: users[id].logic.getBalance(),
					deposit: users[id].deposit,
					points:    users[id].logic.getMyPoints(),

					house: house,
					my:    my,
				}
			}
		}

		return data
	}

	endGame(params){
		if (!this.endGamesMsgs) { this.endGamesMsgs = {} }

		if (this.endGamesMsgs[params.seed]) { return }
		this.endGamesMsgs[params.seed] = true

		const user_id      = params.account || params.user_id
		const room_hash    = this.getUserRoom(user_id)
		const user         = this.getUser(user_id)
		const user_channel = Games[room_hash].channels[user_id]

		if (!user_channel || user_channel.close_proccess || !user_channel.open) {
			console.warn('Channel '+user_channel.id+' allready close proccess')
			return
		}

		if (!user || !user.logic) {
			console.error('Cant find user', user_id)
			console.log(user)
		}

		let close_code = ''

		if (!user) {
			return
		}


		let profit = (user.logic.getBalance() - user.deposit)

		console.log('bankroll profit', profit, (typeof profit))
		console.log('user profit', params.profit)

		params.action = 'game_channel_closed'


		if (params.profit == profit) {
			profit = (profit*1)/100000000

			if (!(profit < 0)) {
				GamesStat.cnt(this.contractAddress, 'wins' )
				GamesStat.cnt(this.contractAddress, 'win_bets', Math.abs(profit) )
			}
			if (profit < 0) {
				GamesStat.cnt(this.contractAddress, 'lose')
				GamesStat.cnt(this.contractAddress, 'lose_bets', Math.abs(profit) )
			}


			close_code += params.address+'_'+user_id+'_'+profit
			if (_closing_channels.indexOf(close_code) > -1) {
				console.log('channel allready closing ', close_code)
				return
			}
			_closing_channels.push(close_code)


			console.log('Channel.close', {profit:profit}, params)

			// DEBUG !!!
			// return

			Games[room_hash].channels[user_id].close_proccess = true

			Channel.close(params.address, user_id, user_channel.id, profit, res => {
				console.log(res)
				params.result = true

				GamesStat.cnt(this.contractAddress, 'close_game')

				console.log('rtc send', params)
				this.RTC.send(params)

				Games[room_hash].channels[user_id].open = false

				// Destroy room when all channels close
				let all_channels_close = true
				let c = Games[room_hash].channels
				for(let k in c){
					if (c[k].open) {
						all_channels_close = false
					}
				}

				if (all_channels_close) {
					setTimeout(()=>{
						delete( Games[room_hash] )
					}, 1000)
				}
			})
			return
		}

		params.result = {
			error  : 'invalid_profit',
			profit : profit
		}
		this.RTC.send(params)
	}


}
