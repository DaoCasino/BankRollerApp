'use strict'

const autoprefixer            = require('autoprefixer')
const fs                      = require('fs')
const path                    = require('path')
const webpack                 = require('webpack')
const HtmlWebpackPlugin       = require('html-webpack-plugin')
const ExtractTextPlugin       = require('extract-text-webpack-plugin')
const ManifestPlugin          = require('webpack-manifest-plugin')
const InterpolateHtmlPlugin   = require('react-dev-utils/InterpolateHtmlPlugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')
const eslintFormatter         = require('react-dev-utils/eslintFormatter')
const ModuleScopePlugin       = require('react-dev-utils/ModuleScopePlugin')

const paths                   = require('./paths')
const getClientEnvironment    = require('./env')

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.servedPath

// Some apps do not use client-side routing with pushState.
// For these, "homepage" can be set to "." to enable relative asset paths.
const shouldUseRelativeAssetPaths = publicPath === './'

const rootdir = __dirname+'/../..'

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1)


// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl)

// Assert this just to be safe.
// Development builds are slow and not intended for server.
if (env.stringified['process.env'].NODE_ENV !== '"server"') {
	throw new Error('server builds must have NODE_ENV=server.')
}

// console.log(rootdir)
// console.log(path.resolve(rootdir, 
// 				'../node_modules/web3/packages/web3-eth-accounts/node_modules/scrypt.js/js.js'
// 			))
// process.exit()

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
let webpack_server_config = {
	target:'node',

	// Don't attempt to continue if there are any errors.
	bail: true,
	// bail: false,

	// We generate sourcemaps in production. This is slow but gives good results.
	// You can exclude the *.map files from the build during deployment.
	// devtool: 'source-map',

	// In production, we only want to load the polyfills and the app code.
	entry: ['babel-polyfill', require.resolve('./polyfills'), paths.appBackground],
	output: {
		// The build folder.
		path: paths.appBuild,

		// Generated JS file names (with nested folders).
		// There will be one main bundle, and one file per asynchronous chunk.
		// We don't currently advertise code splitting but Webpack supports it.
		filename: 'app.background.js',

		// We inferred the "public path" (such as / or /my-project) from homepage.
		publicPath: publicPath,
	},

	resolve: {
		// This allows you to set a fallback for where Webpack should look for modules.
		// We placed these paths second because we want `node_modules` to "win"
		// if there are any conflicts. This matches Node resolution mechanism.
		// https://github.com/facebookincubator/create-react-app/issues/253
		modules: [ rootdir+'/src/model', 'node_modules', paths.appNodeModules].concat(
	  		// It is guaranteed to exist because we tweak it in `env.js`
	  		// process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
		),

		// These are the reasonable defaults supported by the Node ecosystem.
		// We also include .tag as a common component filename extension to support
		// some tools, although we do not recommend using it, see:
		// https://github.com/facebookincubator/create-react-app/issues/290
		extensions: ['.node', '.js', '.json'],
		alias: {
			'app.config': rootdir+'/src/app.config.js',
			model:        rootdir+'/src/model',
			view:         rootdir+'/src/view',
			components:   rootdir+'/src/components',

			// https://github.com/ethereum/web3.js/issues/1105
			// 'fs-ext': path.resolve(rootdir, 'node_modules/fs-ext/node.js'),
			// 'scrypt.js': path.resolve(rootdir, 'node_modules/scrypt.js/node.js'),
			// 'scrypt': path.resolve(rootdir, 'node_modules/scrypt.js/node_modules/scrypt/index.js'),
		},

		plugins: [
			// Prevents users from importing files from outside of src/ (or node_modules/).
			// This often causes confusion because we only process files within src/ with babel.
			// To fix this, we prevent you from importing files out of src/ -- if you'd like to,
			// please link the files into your node_modules/ and let module-resolution kick in.
			// Make sure your source files are compiled, as they will not be processed in any way.
			new ModuleScopePlugin(paths.appSrc),
		],
	},

	module: {
		strictExportPresence: true,
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			// We are waiting for https://github.com/facebookincubator/create-react-app/issues/2176.
			{ parser: { requireEnsure: false } },

			// First, run the linter.
			// It's important to do this before Babel processes the JS.
			{
				test: /\.js$/,
				enforce: 'pre',
				use: [
					{
						options: {
							formatter: eslintFormatter,
						},
						loader: require.resolve('eslint-loader'),
					},
				],
				include: paths.appSrc,
			},

			// ** ADDING/UPDATING LOADERS **
			// The "file" loader handles all assets unless explicitly excluded.
			// The `exclude` list *must* be updated with every change to loader extensions.
			// When adding a new loader, you must add its `test`
			// as a new entry in the `exclude` list in the "file" loader.

			// "file" loader makes sure those assets end up in the `build` folder.
			// When you `import` an asset, you get its filename.
			{
				exclude: [
					/\.html$/,
					/\.js$/,
					/\.tag$/,
					/\.css$/,
					/\.less$/,
					/\.json$/,
					/\.svg$/,
					/\.bmp$/,
					/\.gif$/,
					/\.jpe?g$/,
					/\.png$/,
				],
				loader: require.resolve('file-loader'),
				options: {
					name: 'static/media/[name].[hash:8].[ext]',
				},
			},


			// Process JS with Babel.
			{
				test:    /\.js$/,
				include: paths.appSrc,
				loader:  require.resolve('babel-loader'),
				options: {
					presets: [['env', {
						'targets': {
							'node': '8'
						}
					}]]
				}
			},

			// {
			// 	test: /\/ethereumjs-tx\/index.js$/,
			// 	loader: 'babel-loader',
			// 	options: { presets: ['es2015', 'stage-2'] }
			// },
			{
				test: /\/bufferutil\/fallback.js$/,
				loader: 'babel-loader',
				options: { presets: ['es2015'] }
			},
			{
				test: /\/utf-8-validate\/fallback.js$/,
				loader: 'babel-loader',
				options: { presets: ['es2015'] }
			},


			// ** STOP ** Are you adding a new loader?
			// Remember to add the new extension(s) to the "file" loader exclusion list.
		],
	},

	plugins: [
		// Makes some environment variables available to the JS code, for example:
		// if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
		// It is absolutely essential that NODE_ENV was set to production here.
		// Otherwise React will be compiled in the very slow development mode.
		new webpack.DefinePlugin(env.stringified),
	],

	// Some libraries import Node modules but don't use them in the browser.
	// Tell Webpack to provide empty mocks for them so importing them works.
	node: {
		fs:  'empty',
		net: 'empty',
		tls: 'empty',
	},
}


module.exports = webpack_server_config
