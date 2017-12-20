
# 🌐 Decentralized applications

DApps based on protocol **dao.casino** consist of a distributed network of backend-applications called "[bankroller app](https://github.com/DaoCasino/BankRollerApp)", [smart contracts](https://github.com/DaoCasino/Protocol/tree/master/contracts) and frontend part. The [DC.js](https://github.com/DaoCasino/DCLib) library needs to connect all this parts and provide tools for create p2p games.

## Table of Contents

- [General Workflow](#-general-workflow)
- [Offchain](#️-offchain)
- [File structure](#-file-structure)
  - [dapp.manifest](#dappmanifest)
  - [dapp_logic.js](#dapp_logicjs)
  - [index.html](#indexhtml)
  - [bankroller.js](#bankrollerjs)
- [Launch examples](#-launch-examples)

## :construction: General Workflow

1. At the beginning the player performs the function `approve` to the `ERC20` contract which allows the contract of the game to deposit funds from the player's account in the amount of the selected deposit [read more about ERC20 approve](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md#approve)
2. The library [DC.js](https://github.com/DaoCasino/DCLib) which is launched in the player's browser finds a suitable bankroller (filter by bankrollers balance and keccak256(logic.js)) and connect to him. We use WebRTC as transport.
3. The player's frontend sends a request that includes [the data (more details here) and the signature by its private key](https://github.com/DaoCasino/Protocol/tree/master/contracts#openchannel) to the bankroller.
4. Bankroll checks the data and opens the channel [открытие канала](https://github.com/DaoCasino/Protocol/tree/master/contracts#openchannel).
5. The contract of the game freezes the player and the bankroller's funds (the bankroller is freezing much more funds to cover the player's winnings).
6. A player and a bankroll play [in offchain](#️-offchain).
7. The player ends the game session.
8. The bankroller checks the data and calls [close channel](https://github.com/DaoCasino/Protocol/tree/master/contracts#openchannel).
9. A smart game contract unfreezes and distributes funds between the player, the bankroll, the operator, the referrer and the game developer in accordance with the set parameters.

![scheme](./scheme.jpg "main scheme")

### multisig

The contract of the channels is the realization of the multi-sig contract. The player signs the obligation and passes it to the bankroller. Participant can send to the contract only the data signed by another participant. 

![multisig](./multisig_scheme.png "multisig scheme")

### Disputes

We have implemented a mechanism for solving controversial situations(disputes) for our games smart contracts. In case of fraud, cheated party can send a request to [open a dispute](https://github.com/DaoCasino/Protocol/tree/master/contracts#opendispute). After dispute is opened, other side has a temporary window, to [provide evidence of fair play](https://github.com/DaoCasino/Protocol/tree/master/contracts#closedispute). In case of failure to provide proof, the game ends in favor of the deceived party.

## ⚡️ Offchain

To scale decentralized applications, increase the speed and reduce the cost of transactions, **dao.casino** uses [game channels technology](https://medium.com/@dao.casino/dao-casino-charges-up-dice-game-with-gc-technology-46f6a4bb5df9). It is based on [payment channels](https://en.bitcoin.it/wiki/Payment_channels).[DC.js library](https://github.com/DaoCasino/DCLib) has all the necessary methods  for working with *game channels* and *payment channels*.
> ### *Game channels*

 *Player and bankroller deciding to start game. Player sends signed hash, bankroller check it and creates transaction to open a channel. When game begins, player sends game state with seed (which is needed for Signidice algorithm) to bankroller. Bankroller signs seed and sends it back — that’s a game process. Depending on game results, participants refresh channel state.
Channel can be closed at any time. To do this, player sends the last state of the channel to the bankroller with a request for closure, after which the bankroller closes the channel.*

## 📁 File structure

|name|description|
|---|---|
|`manifest.json`|Configuration file **bankroller app**|
|`dapp_logic.js`|Basic logic of the aaplication. Must have for both sides (clients and bankroller [bankroller app](https://github.com/DaoCasino/BankRollerApp))|
|`index.html`|Frontend of the game where [DC.js](https://github.com/DaoCasino/DCLib) is connected |
|`bankroller.js`|The part executed inside the [bankroller app](https://github.com/DaoCasino/BankRollerApp)|

### manifest.json

The root folder for each application must contain the manifest.json file

Required fields:

|name|description|
|---|---|
|`name`|title of application|
|`slug`|unique namespace|
|`index`|path to the frontend file (ex. index.html)|
|`logic`|path to the logic.js|
|`run`|path to the backend.js (witch runs on the [bankroller app](https://github.com/DaoCasino/BankRollerApp))|

Example:

```js
{
  "name"  : "Dice DApp Example",
  "code"  : "dicedapp_v2",
  "index" : "./index.html",
  "logic" : "./dapp_logic.js",
  "run"   : "./bankroller.js"
}
```

### dapp_logic.js

Basic logic of the aaplication. Must have for both sides (clients and bankroller)

Example:

```js
DCLib.defineDAppLogic('dicedapp_v2', function(){
    const _self = this
    var ping = function(){
      return "pong";
    }
    return _self;
})
````

### index.html

This code executed on the gamer's side (in a browser)

Example:

```html
<script src="https://platform.dao.casino/api/lib/v2/DC.js?v=2"></script> <!-- connect library DC.js -->
<script src="dapp_logic.js"></script> <!-- connect logic file -->
<script>
    window.App = new DCLib.DApp({code :'pinpong'})
    App.connect({bankroller : "auto"}, function(connected){
      if (connected) {
        var randomHash = DCLib.Utils.makeSeed();
        App.call('ping', [], console.log); // return "pong"
      }
    });
<script>
```

### bankroller.js

This code executed in the [bankroller app](https://github.com/DaoCasino/BankRollerApp).

Example:

```js
window.MyDApp_debug = (function(){
  var myDApp = new DCLib.DApp({code : 'dicedapp_v2'})

  // Banroller side code
  // console.log(myDApp)

  return myDApp
})()
```

## 🔌 Launch examples

1. Download and install [Bankroller app](https://github.com/DaoCasino/BankRollerApp/releases)
2. In **DEV** tab, you find DApp example download it and view sources.
3. Click **Open in browser**.

[Watch video](https://www.youtube.com/watch?v=vD2kI_4IEFA)

## ⛓ Links

* [Minimum viable game](https://daocasino.readme.io/docs)
* [DC Library](https://github.com/DaoCasino/DClib)
* [Bankroller application](https://github.com/DaoCasino/BankRollerApp/releases)
* [Contracts](https://github.com/DaoCasino/Protocol/tree/master/contracts)
