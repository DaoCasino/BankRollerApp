# FindTheEthereum
:gem: Find the ether in one of the three boxes!

## Rules of the game
The player makes a deposit and chooses a bet.
Purpose of the game: guess the casket with the etherium. 
The game has a winstreak system. If the player guessed the box, he can continue the game to get more BET. When the player finishes the game, he withdraws the money.

#### Winstreak system
1. - x2
2. - x4
3. - x10
4. - x20
5. - x50

## Table of Contents
- [File structure](#-file-structure)
  - [dapp.manifest](#dappmanifest)
  - [GameLogic.js](#gamelogicjs)
  - [bankroll.js](#bankrolljs)
  
## 📁 File structure
|name|description|
|---|---|
|`dapp.mainfest`|Configuration file for the **bankroll app**|
|`GameLogic.js`|The file contains the main logic and is a common file for the **bankroll app** and the client|
|`bankroll.js`|The part that is executed inside the **bankroll app**|

### dapp.manifest
The application manifest contains basic information about the application and the path to the files.

### GameLogic.js
The file contains the main logic of the application. The file is shared between the client and server parts.

### bankroll.js
The file contains executable code on the **bankroll app** side.
