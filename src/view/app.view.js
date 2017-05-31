import $ from 'jquery'
import _config from '../app.config.js'

import riot  from 'riot'
import route from 'riot-route'

import toastr from 'toastr'


export default class View {
	constructor() {
		this.importTags()

		riot.mount('*')

		this.routing()

		if (!this.isFontAvaible('Roboto')) {
			$('body').append('<link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;subset=cyrillic" rel="stylesheet">')
		}
	}

	importTags() {
		let tc = require.context('./components/', true, /\.tag$/)
		tc.keys().forEach(function(path){ tc(path) })
	}

	routing() {
		route.base('#')
		route.start(true)
	}


	/*
	 * Copy address to clippboard
	 */
	copyToClipboard(text){
		const input          = document.createElement('input')
		input.style.position = 'fixed'
		input.style.opacity  = 0
		input.value          = text

		document.body.appendChild(input)

		input.select()
		document.execCommand('Copy')
		document.body.removeChild(input)

		toastr.options.showDuration    = 100
		toastr.options.hideDuration    = 100
		toastr.options.timeOut         = 1000
		toastr.options.extendedTimeOut = 100

		if (!this.toastshowed) {
			toastr.success('Copied to clipboard', '')
			this.toastshowed = true
		}
		this.toast_t = setTimeout(()=>{
			this.toastshowed = false
		}, 2000)
	}

	isFontAvaible(font){
		let width
		let body = document.body

		let container = document.createElement('span')
		container.innerHTML = Array(100).join('wi')
		container.style.cssText = [
			'position:absolute',
			'width:auto',
			'font-size:128px',
			'left:-99999px'
		].join(' !important;')

		let getWidth = function (fontFamily) {
			container.style.fontFamily = fontFamily

			body.appendChild(container)
			width = container.clientWidth
			body.removeChild(container)

			return width
		}

		// Pre compute the widths of monospace, serif & sans-serif
		// to improve performance.
		let monoWidth  = getWidth('monospace')
		let serifWidth = getWidth('serif')
		let sansWidth  = getWidth('sans-serif')


		return monoWidth !== getWidth(font + ',monospace') ||
		  sansWidth !== getWidth(font + ',sans-serif') ||
		  serifWidth !== getWidth(font + ',serif')
	}
}
