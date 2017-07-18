const config       = require('./config/favicons.config.js')

const favicons     = require('favicons')
const fs           = require('fs')
const path         = require('path')
const chalk        = require('chalk')
const clearConsole = require('react-dev-utils/clearConsole')


const mkdirSync = function (dirPath) {
	try {
		fs.mkdirSync(dirPath)
	} catch (err) {
		if (err.code !== 'EEXIST') throw err
	}
}

mkdirSync(config.files_dest)


favicons(config.source_img, config.settings, function (error, response) {
	if (error) {
		console.log(error.status)  // HTTP error code (e.g. `200`) or `null`
		console.log(error.name)    // Error name e.g. "API Error"
		console.log(error.message) // Error description e.g. "An unknown error has occurred"
		return
	}
	clearConsole()
	console.log('Generated '+response.images.length+' images\n')

	response.images.forEach( img => {
		fs.writeFileSync(config.files_dest+img.name, img.contents)
	})

	response.files.forEach( file => {
		console.log('Write '+config.files_dest+file.name)
		fs.writeFileSync(config.files_dest+file.name, file.contents)
	})

	let metahtml = `
		<title>${config.settings.appName}</title>
		<meta name="description" content="${config.settings.appDescription}">
		${response.html.join('\n')}
	`
	fs.writeFileSync(config.files_dest+config.html_filename, metahtml)

	// console.log(response.images)   // Array of { name: string, contents: <buffer> }
	// console.log(response.files)    // Array of { name: string, contents: <string> }
	// console.log(response.html)     // Array of strings (html elements)
})


clearConsole()
console.log(chalk.cyan('Generate favicons...\n'))
