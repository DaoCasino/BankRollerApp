

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

export const pad = (num, size) => {
	var s = num + ''
	while (s.length < size) s = '0' + s
	return s
}


