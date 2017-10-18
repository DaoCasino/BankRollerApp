import _config  from 'app.config'
import Eth      from 'Eth/Eth'


export default class ApproveContract {
	// Проверяем разрешил ли игрок списывать бэты контракту
	constructor(address, callback){
		this.getAllowance(address, allowance_bets =>{
			// console.log('allowance_bets',allowance_bets)
			if (allowance_bets < 1000000) {
				this.approveContract(address, 2000000, ()=>{
					this.setGameContract(address, callback)
					return
				})
				return
			}

			// all ok
			callback()
		})
	}

	// Проверяем сколько денег разрешено списывать контракту игры
	getAllowance(address, callback){
		if (!address) {
			return
		}
		
		Eth.RPC.request('call', [{
			'from' : Eth.Wallet.get().openkey,
			'to'   : _config.erc20_address,
			'data' : '0x'+Eth.hashName('allowance(address,address)') + Utils.pad(Eth.Wallet.get().openkey.substr(2), 64) + Utils.pad(address.substr(2), 64)
		}, 'latest']).then( response => {
			callback( Utils.hexToNum(response.result) )
		})
	}

	// Разрешаем контракту игры списывать с нас бэты
	approveContract(address, max_bets, callback, repeat=3){
		
		if (!confirm(`Allow the game ${this.code} / ${address} to write off with your money?`)) {
			return
		}
		
		this.transactContractFunction(
			_config.erc20_address, _config.erc20_abi,

			'approve', [address, max_bets*100000000],

			0,

			response => {
				if (!response || !response.result) {
					setTimeout(()=>{
						console.log('repeat approveContract')
						repeat--
						if (repeat < 1) {
							callback({error:'Cant_approve_contract'})
							return
						}
						this.approveContract(address, max_bets, callback, repeat)
					}, 3000)
					return
				}

				const checkResult = ()=>{ setTimeout( ()=>{
					this.getAllowance(address, res => {
						if (res >= max_bets*100000000) {
							callback( res )
							return
						}
						checkResult()
					})
				}, 2000) }

				checkResult()
			}
		)
	}
	
	transactContractFunction(address, abi, func_name, func_params, value=0, callback){
		Eth.Wallet.signedContractFuncTx(
			address, abi, func_name, func_params,
			signedTx => {
				Eth.RPC.request('sendRawTransaction', ['0x' + signedTx]).then( callback )
			}
		)
	}
}