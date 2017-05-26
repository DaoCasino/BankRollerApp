

export const toFixed = (value, precision) => {
	precision = Math.pow(10, precision)
	return Math.ceil(value * precision) / precision
}

export const numToHex = (num) => {
	return num.toString(16)
}

export const hexToNum = (str) => {
	return parseInt(str, 16)
}

export const hexToString = (hex) => {
	let str = ''
	for (let i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
	return str
}

export const pad = (num, size) => {
	let s = num + ''
	while (s.length < size) s = '0' + s
	return s
}


export const reverseForIn = (obj, f) => {
	let arr = []
	for (let key in obj) {
		arr.push(key)
	}
	for (let i=arr.length-1; i>=0; i--) {
		f.call(obj, arr[i])
	}
}


