/**
 * Created by DAO.casino
 * BlackJack
 * v 1.0.6
 */

var LogicJS = function(params){
	var _self = this

	var BLACKJACK = 21

	var DEAL      = 0
	var HIT       = 1
	var STAND     = 2
	var SPLIT     = 3
	var DOUBLE    = 4
	var INSURANCE = 5

	var COUNT_DECKS = 4
	var COUNT_CARDS = 52

	var _money       = 0
	var _balance     = 0
	var _myPoints    = 0
	var _splitPoints = 0
	var _housePoints = 0
	var _idGame      = 0

	var _arMyCards       = []
	var _arMySplitCards  = []
	var _arHouseCards    = []
	var _arMyPoints      = []
	var _arMySplitPoints = []
	var _arHousePoints   = []
	var _arDecks         = []
	var _arCards         = []

	var _bStand          = false
	var _bStandNecessary = false
	var _bSplit          = false

	var _prnt
	var _callback

	if(params){
		if(params.prnt){
			_prnt = params.prnt
		}
		if(params.callback){
			_callback = params.callback
		}
		_balance = params.balance || 0
	}

	var _objSpeedGame = {result:false,
		idGame:-1,
		curGame:{},
		betGame:0,
		betSplitGame:0,
		money:_money,
		insurance:false}
	var _objResult = {main:'', split:'', betMain:0, betSplit:0, profit:0, mixing:false}

	mixDeck()

	_self.bjDeal = function(_s, _bet){
		_idGame ++
		_objResult = {main:'', split:'', betMain:0, betSplit:0, profit:-_bet, mixing:false}

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

		var seedarr = ABI.rawEncode([ 'bytes32' ], [ _s ])
		dealCard(true, true, seedarr[15])
		dealCard(false, true, seedarr[16])
		dealCard(true, true, seedarr[17])
		refreshGame(_s)
	}

	_self.bjHit = function(_s, isMain){
		dealCard(true, isMain, _s)
		refreshGame(_s)
	}

	_self.bjStand = function(_s, isMain){
		var seedarr = ABI.rawEncode([ 'bytes32' ], [ _s ])
		stand(isMain, seedarr)
		refreshGame(_s)
	}

	_self.bjSplit = function(_s){
		var seedarr = ABI.rawEncode([ 'bytes32' ], [ _s ])

		_arMySplitCards  = [_arMyCards[1]]
		_arMyCards       = [_arMyCards[0]]
		_arMySplitPoints = [_arMyPoints[0]]
		_arMyPoints      = [_arMyPoints[0]]
		_myPoints        = getMyPoints()
		_splitPoints     = getMySplitPoints()
		_bSplit          = true

		dealCard(true, true, seedarr[15])
		dealCard(true, false, seedarr[16])

		_objSpeedGame.betSplitGame = _objSpeedGame.betGame
		_money                    -= _objSpeedGame.betSplitGame
		_objSpeedGame.money        = _money
		_objResult.profit         -= _objSpeedGame.betSplitGame
		refreshGame(_s)
	}

	_self.bjDouble = function(_s, isMain){
		var seedarr = ABI.rawEncode([ 'bytes32' ], [ _s ])
		dealCard(true, isMain, _s)
		stand(isMain, seedarr)
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
		_objSpeedGame.insurance = true
		_money -= _bet
		_objSpeedGame.money = _money
		_objResult.profit -= _bet
	}

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
			_callback(_objSpeedGame)
		}

		if(_objSpeedGame.result){
			// console.log("Game Over", _objResult.profit, _money);
			var prcnt = Math.ceil(COUNT_DECKS*COUNT_CARDS*0.25)
			if(_arCards.length > prcnt){
				mixDeck()
			}
		}
	}

	function stand(isMain, s){
		_bSplit = false
		if (!isMain) {
			return
		}

		_bStand = true

		if(_myPoints > BLACKJACK &&
		(_arMySplitCards.length == 0 ||
		_splitPoints > BLACKJACK)){
			dealCard(false, true, s[15])
		} else {
			var val = 15
			while (_housePoints < 17 && val < 64) {
				dealCard(false, true, s[val])
				val += 1
			}
		}
	}

	function dealCard(player, isMain, seed){
		var newCard = createCard(seed)

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
					var seedarr = ABI.rawEncode([ 'bytes32' ], [ seed ])
					stand(isMain, seedarr)
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
		var points = _splitPoints
		var bet = _objSpeedGame.betSplitGame
		var betWin = 0
		var countCard = _arMySplitCards.length
		var state = ''

		if(isMain){
			countCard = _arMyCards.length
			points = _myPoints
			bet = _objSpeedGame.betGame

			if(_objSpeedGame.result){
				return false
			}
		}

		if(points == BLACKJACK && _housePoints == BLACKJACK && state==''){
			state = 'push'
			betWin = bet
			if(isMain){
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

		if (points == BLACKJACK && state=='' && countCard == 2) {
			state = 'blackjack'
			bet = bet * 2.5
			betWin = bet
			if(isMain){
				_objSpeedGame.result = true
			} else {
				_bSplit = false
			}
		}
		if (points > BLACKJACK && state=='') {
			state = 'bust'
			if(isMain){
				_objSpeedGame.result = true
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

		if(!_objSpeedGame.result){
			if(_bStand){
				_objSpeedGame.result = true
			} else if(points == BLACKJACK && isMain && !_bSplit){
				if(_bStandNecessary){
					_objSpeedGame.result = true
				} else {
					_bStandNecessary = true
					_self.bjStand(_s, isMain)
					return false
				}
			}
		}

		if(_objSpeedGame.result){
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

	function createCard(cardNumber){
		var hash = ABI.soliditySHA3(['bytes32'],[ cardNumber ]).toString('hex')
		hash = hash.substr(hash.length-2, hash.length) // uint8
		var rand = bigInt(hash,16).divmod(52).remainder.value
		rand = checkCard(rand)
		_arDecks[rand] ++
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

		_arMyCards       = _objSpeedGame.curGame.arMyCards
		_arMySplitCards  = _objSpeedGame.curGame.arMySplitCards
		_arHouseCards    = _objSpeedGame.curGame.arHouseCards
		_arMyPoints      = []
		_arMySplitPoints = []
		_arHousePoints   = []

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

	return _self
}


const game_code = 'BJ'


import ABI        from 'ethereumjs-abi'
import bigInt     from 'big-integer'
import Eth        from 'Eth/Eth'
import Rtc        from 'rtc'
import Channel    from 'Channel'
import * as Utils from 'utils'


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

		let game_id = params.game_id || 'start'
		let user_id = params.user_id

		if (!Games[user_id]) {
			Games[user_id] = {}
		}
		if (!Games[user_id][game_id]) {
			Games[user_id][game_id] = new LogicJS()
		}

		Games[user_id][game_id].channel = 'opened'
		Games[user_id][game_id].deposit = params.deposit
		Games[user_id][game_id].user_id = params.user_id

	}

	endGame(params){
		if (!this.endGamesMsgs) { this.endGamesMsgs = {} }

		if (this.endGamesMsgs[params.seed]) { return }
		this.endGamesMsgs[params.seed] = true

		let user_id = params.user_id


		let close_code = ''

		let profit = 0
		for(let k in Games[user_id]){
			if (['closing...','closed'].indexOf(Games[user_id][k].channel) > -1 ) {
				continue
			}
			profit += Games[user_id][k].getResult().profit
			Games[user_id][k].channel = 'closing...'
			close_code += user_id+'_'+k+'_'
		}
		// delete(Games[user_id])

		console.log('bankroll profit', profit)
		console.log('user profit', params.profit)

		params.action = 'game_channel_closed'

		if (params.profit == profit) {
			profit = profit/100000000


			close_code += params.address+'_'+params.account+'_'+profit
			if (_closing_channels.indexOf(close_code) > -1) {
				console.log('channel allready closing ', close_code)
				return
			}
			_closing_channels.push(close_code)


			console.log('Channel.close', {profit:profit}, params)
			Channel.close(params.address, params.account, params.channel_id, profit, res => {
				console.log(res)
				params.result = true

				for(let k in Games[user_id]){
					Games[user_id][k].channel = 'closed'
				}

				console.log('rtc send', params)
				this.RTC.send(params)
			})
			return
		}

		params.result = {
			error  : 'invalid_profit',
			profit : profit
		}
		this.RTC.send(params)
	}

	callGameFunction(user_id, game_id, function_name, function_args){
		// console.log(game_id, function_name, function_args)
		if (!Games[user_id]) {
			Games[user_id] = {}
		}

		if (Games[user_id]['start']) {
			Games[user_id][game_id] = Games[user_id]['start']
			delete(Games[user_id]['start'])
		}

		if (!Games[user_id][game_id]) {
			Games[user_id][game_id] = new LogicJS()
		}

		if (!Games[user_id][game_id][function_name]) {
			return
		}

		function_args = this.prepareArgs(function_args)

		if (function_args) {
			Games[user_id][game_id][function_name].apply(null, function_args)
		} else {
			Games[user_id][game_id][function_name]()
		}

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
}
