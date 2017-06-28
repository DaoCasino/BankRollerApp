var webpack               = require('webpack')
var path                  = require('path')
var HtmlWebpackPlugin     = require('html-webpack-plugin')
var ExtractTextPlugin     = require('extract-text-webpack-plugin')
var ManifestPlugin        = require('webpack-manifest-plugin')
var InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
var url                   = require('url')
var paths                 = require('./paths')
var getClientEnvironment  = require('./env')
var getCustomConfig       = require('./get-custom-config')


var rootdir = __dirname+'/../..'

function ensureSlash(path, needsSlash) {
	var hasSlash = path.endsWith('/')
	if (hasSlash && !needsSlash) {
		return path.substr(path, path.length - 1)
	} else if (!hasSlash && needsSlash) {
		return path + '/'
	} else {
		return path
	}
}

var homepagePath     = require(paths.appPackageJson).homepage
var homepagePathname = homepagePath ? url.parse(homepagePath).pathname : '/'
var publicPath       = ensureSlash(homepagePathname, true)
var publicUrl        = ensureSlash(homepagePathname, false)
var env              = getClientEnvironment(publicUrl)
var customConfig     = getCustomConfig(true)

if (env['process.env'].NODE_ENV !== '"server"') {
	throw new Error('Server builds must have NODE_ENV=server.')
}

module.exports = {
	bail: false,
	devtool: 'source-map',
	entry: [
		require.resolve('./polyfills'),
		paths.appBackground
	],
	output: {
		path: paths.appBuild,
		filename: 'app.background.js',
		publicPath: publicPath
	},
	resolve: {
		root: [
			path.resolve(rootdir+'/src/model'),
		],

		extensions: ['.js', '.json', '.tag', ''],
		alias: {
			'app.config': rootdir+'/src/app.config.js',
			// model:        rootdir+'/src/model',
			view:         rootdir+'/src/view',
			components:   rootdir+'/src/components',
		}
	},

	module: {
		preLoaders: [
			{
				test: /\.(js|tag)$/,
				loader: 'eslint',
				include: paths.appSrc,
			},
		],
		loaders: [
			{
				exclude: [
					/\.(js|tag)$/,
				].concat(customConfig.excludedFilesRegex),
				loader: 'url',
				query: {
					limit: 10000,
					name: 'static/media/[name].[hash:8].[ext]'
				}
			},
			{
				test: /\.js$/,
				include: paths.appSrc,
				loader: 'babel',
				query: {
					presets: ['es2015'],
				}
			},
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

			{
				test: /\.json$/,
				loader: 'json'
			},
		].concat(customConfig.loaders)
	},


	plugins: [
		new webpack.DefinePlugin(env),
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.optimize.DedupePlugin(),
	].concat(customConfig.plugins),

	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
}
