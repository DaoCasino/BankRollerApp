const electron      = require('electron')
const app           = electron.app
const BrowserWindow = electron.BrowserWindow
const path          = require('path')
const url           = require('url')

let mainWindow

function createWindow () {
	mainWindow = new BrowserWindow({width: 800, height: 600})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindow.on('closed', function () { mainWindow = null })

	let handleRedirect = (e, url) => {
		if(url != mainWindow.webContents.getURL()) {
			e.preventDefault()
			require('electron').shell.openExternal(url)
		}
	}
	mainWindow.webContents.on('will-navigate', handleRedirect)
	mainWindow.webContents.on('new-window',    handleRedirect)

	// DevTools
	if (process.env.dev) {
		const client = require('electron-connect').client
		client.create(mainWindow)
		mainWindow.webContents.executeJavaScript(`
			require('electron-connect').client.create()
  			require('electron-css-reload')(250)
		`)

		mainWindow.webContents.openDevTools()
	}
}

app.on('ready', createWindow)

app.on('activate', function() {
	if (mainWindow === null) {
		createWindow()
	}
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
