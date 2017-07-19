/*
 * Settings for favicons and webapp manifest generator
 * https://www.npmjs.com/package/favicons
 * see ./scripts/favicons.js
 */

const meta       = require('../../package.json').meta
const version    = require('../../package.json').version

const source_img = './src/favicon_source.png'
const files_dest = './public/static/meta/'

module.exports = {

	source_img: source_img,
	files_dest: files_dest,


	settings: {
		path           : files_dest,          // Path for overriding default icons path. `string`
		appName        : meta.appName,        // Your application's name. `string`
		appDescription : meta.appDescription, // Your application's description. `string`
		developerName  : null,                // Your (or your developer's) name. `string`
		developerURL   : null,                // Your (or your developer's) URL. `string`
		version        : version,             // Your application's version number. `number`
		logging        : true,                // Print logs to console? `boolean`
		online         : false,               // Use RealFaviconGenerator to create favicons? `boolean`
		preferOnline   : false,               // Use offline generation, if online generation has failed. `boolean`
		background     : meta.background,     // Background colour for flattened icons. `string`
		theme_color    : meta.theme_color,    // Theme color for browser chrome. `string`
		display        : meta.display,        // Android display: "browser" or "standalone". `string`
		orientation    : meta.orientation,    // Android orientation: "portrait" or "landscape". `string`
		start_url      : meta.start_url,      // Android start application's URL. `string`

		icons: {
			// Platform Options:
			// - offset - offset in percentage
			// - shadow - drop shadow for Android icons, available online only
			// - background:
			//   * false - use default
			//   * true - force use default, e.g. set background for Android icons
			//   * color - set background for the specified icons
			//
			android:      true, // Create Android homescreen icon. `boolean` or `{ offset, background, shadow }`
			appleIcon:    true, // Create Apple touch icons. `boolean` or `{ offset, background }`
			appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background }`
			favicons:     true, // Create regular favicons. `boolean`
			firefox:      true, // Create Firefox OS icons. `boolean` or `{ offset, background }`
			windows:      true, // Create Windows 8 tile icons. `boolean` or `{ background }`
			yandex:       true, // Create Yandex browser icon. `boolean` or `{ background }`

			// Create Opera Coast icon with offset 25%. `boolean` or `{ offset, background }`
			coast: { offset: 25 },
		}
	},

	html_filename: 'head_meta.html',
}
