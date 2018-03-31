const _config = require('./config.electron.js')

require('./server.electron.js')

const {
	app,
	BrowserWindow,
	Menu,
	MenuItem,
	Tray,
	shell
} = require('electron')

// for ballon nofify
global.Tray = Tray


const path = require('path')
const url  = require('url')

require('electron-debug')({
	enabled:      true  ,
	showDevTools: false ,
})


// Check updates
// require('electron-simple-updater').init({
// 	checkUpdateOnStart: true,
// 	autoDownload:       true
// })


let mainWindow = null

// Prevent double open
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore()
		}
		mainWindow.focus()
	}
})
if (shouldQuit) {
	app.quit()
}


function createWindow () {
	mainWindow = new BrowserWindow({
		title: 'Bankroller',

		// resizable: false, 
		width: 670, height: 530,

		icon: path.join(__dirname, 'static/icons/icon-128.png'),

		// without frame
		// frame: false, transparent: true,
	})


	mainWindow.loadURL(_config.index_page_url)

	mainWindow.on('closed', () => { mainWindow = null })

	// Open links in browser
	let handleRedirect = (e, url) => {
		if (url.indexOf('accounts.google.com')==-1 && url != mainWindow.webContents.getURL()) {
			e.preventDefault()
			shell.openExternal(url)
		}
	}
	mainWindow.webContents.on('will-navigate', handleRedirect)
	mainWindow.webContents.on('new-window',    handleRedirect)

	// DevTools
	if (process.env.dev) {
		// mainWindow.webContents.executeJavaScript(`
		// 	window.location = 'http://localhost:9999'
		// `)

		mainWindow.webContents.openDevTools()
	}



	const DEV_item = { 
		label: 'DEV',
		submenu: [{ 
			label: 'Open DevTools',
			accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
			click:() => {
				mainWindow.webContents.openDevTools()
			} 
		},{
			label: 'Docs',
			click:() => {
				shell.openExternal('https://github.com/DaoCasino/DCLib')
			} 
		}]
	}

	const mainmenu = Menu.getApplicationMenu()
	if (mainmenu) {
		mainmenu.append(new MenuItem(DEV_item))
		Menu.setApplicationMenu( mainmenu )
	} else {
		Menu.setApplicationMenu( Menu.buildFromTemplate([DEV_item]) )
	}


	// minimize to tray
	const trayIcon = new Tray(path.join(__dirname, 'static/icons/icon-38.png'))
	trayIcon.setToolTip('Dao.Casino')
	trayIcon.setContextMenu(Menu.buildFromTemplate([
		{ label: 'Show Dev Tools', click:() => {
			mainWindow.webContents.openDevTools()
		} },
		{ label: 'Quit', click:() => {
			app.isQuiting = true
			app.quit()

		} }
	]))
	trayIcon.on('click', () => {
		mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
	})

	// mainWindow.on('minimize', event => {
	// 	event.preventDefault()
	// 	mainWindow.hide()
	// })
	// mainWindow.on('close', event => {
	// 	if(!app.isQuiting){
	// 		event.preventDefault()
	// 		mainWindow.hide()
	// 	}
	// 	return false
	// })
}

app.on('ready', ()=>{
	setTimeout(()=>{ createWindow() }, 3000 )
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

