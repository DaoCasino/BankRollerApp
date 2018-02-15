import riot  from 'riot'
import route from 'riot-route'

import toastr from 'toastr'

export default class View {
  constructor () {
    this.importTags()

    riot.mount('*')

    this.routing()
  }

  importTags () {
    let tc = require.context('./components/', true, /\.tag$/)
    tc.keys().forEach(function (path) { tc(path) })
  }

  routing () {
    route.base('#')
    route.start(true)
  }

  /*
   * Copy address to clippboard
   */
  copyToClipboard (text) {
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
    this.toast_t = setTimeout(() => {
      this.toastshowed = false
    }, 2000)
  }
}
