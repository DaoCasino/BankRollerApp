

# 🌐 Decentralized applications

Децетрализованные приложения основанные на протоколе **dao.casino** состоят из распределенной сети серверных приложений (**bankroller app**), смарт-контрактов и клиентской части. Библиотека `DC.js` упрощает взаимодействие всех сторон и предоставляет инструментарий для построения децентрализованных приложений на базе протокола **dao.casino**.

## Table of Contents

- [Offchain](#-offchain)
- [File structure](#-file-structure)
  - [dapp.manifest](#dappmanifest)
  - [dapp_logic.js](#dapp_logicjs)
  - [index.html](#indexhtml)
  - [bankroller.js](#bankrollerjs)
- [Launch examples](#-launch-examples)

## ⚡️ Offchain

Для масштабирования децентрализованных приложений, увеличения скорости и снижения стоимости транзакций, протокол **dao.casino** использует технологию [game channels](https://medium.com/@dao.casino/dao-casino-charges-up-dice-game-with-gc-technology-46f6a4bb5df9). В основе *игровых каналов* лежит концепция *off-chain* транзакций, известная как [payment channels](https://en.bitcoin.it/wiki/Payment_channels). Библиотека `DC.js` содержит все необходимые методы для работы с *игровыми* и *платежными каналами*.
> ### *Payment channels*

 *Технология платежных каналов позволяет безопасно обмениваться транзакциями, не транслируя их в основную сеть. Стороны инициируют открытие платежного канала и замораживают средства на смарт-контракте. После чего начинают обмен транзакциями(обещаниями) между друг другом, но не отправляют транзакции в блокчейн. После завершения взаимодействий стороны подводят итог и отправляют транзакцию закрытия канала с актуальным состоянием распределения средств, замороженных на смарт-контракте. Это позволяет привести неограниченное колличество транзакций к двум, тем самым многократно уменьшая комиисии и увеличивая скорость.*

## 📁 File structure

|name|description|
|---|---|
|`dapp.mainfest`|Файл конфигурации для **bankroller app**|
|`dapp_logic.js`|Файл содержит основную логику и являтся общим файлом для **bankroller app** и клиента|
|`index.html`|Клиентская часть приложения где подключена библиотека `DC.js`|
|`bankroller.js`|Часть исполняемая внутри **bankroller app**|

### dapp.manifest

Манифест приложения содержит основную информацию о приложении и пути к файлам.

Обязательные поля манифеста:

|name|description|
|---|---|
|`name`|Название приложения|
|`code`|Код приложения|
|`index`|путь к клиентскому файлу приложения|
|`logic`|путь к файлу основной логики приложения|
|`run`|путь к файлу для **bankroller app**|

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

Logic содержит основную логику приложения. Файл являтся общим для клиентской и серверной части.

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

Файл исполняемый на стороне клиента.

Example:

```html
<script src="https://platform.dao.casino/api/lib/v2/DC.js?v=2"></script> <!-- connect library DC.js -->
<script src="dapp_logic.js"></script> <!-- connect logic file -->
<script>
    window.App = new DCLib.DApp({code :'dicedapp_v2'})
    App.connect({bankroller : "auto"}, function(connected){
      if (connected) {
        var randomHash = DCLib.Utils.makeSeed();
        App.call('ping', [], console.log); // return "pong"
      }
    });
<script>
```

### bankroller.js

Файл содержит код исполняемый на стороне **bankroller app**

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
