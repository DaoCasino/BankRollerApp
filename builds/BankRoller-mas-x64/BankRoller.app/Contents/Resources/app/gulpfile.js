var gulp               = require('gulp'),
	path               = require('path'),
	queueTasks         = require('run-sequence'),
	sourcemaps         = require('gulp-sourcemaps'),
	less               = require('gulp-less'),
	replace            = require('gulp-replace'),
	minifyHTML         = require('gulp-minify-html'),
	prefixer           = require('gulp-autoprefixer'),
	cleanCSS           = require('gulp-clean-css'),
	clean              = require('gulp-rimraf'),

	webpack2           = require('webpack'),
	webpackStream      = require('webpack-stream'),

	browserSync        = require('browser-sync').create(),
	historyApiFallback = require('connect-history-api-fallback')


// By default run dev server
gulp.task('default', ['dev_server'])

// Build for production
gulp.task('build', ()=>{
	queueTasks(
		'clean',
		['html_prod', 'css_prod', 'assets'],
		'webpack_prod'
	)
})

/*
 * Settings
 */
const _config = {
	paths:{
		src:  './src',
		dest: './dist',
		css:  './src/styles.less',

		js_all:  ['src/**/*.js'],
		js: {
			client:     'app.client.js',
			background: 'app.background.js',
		},

		assets:{
			'./src/manifest.json':   './dist/',
			'./src/_locales/**/*.*': './dist/_locales/',
			'./src/view/assets/**/*.*':   './dist/assets/',
		}
	}
}

// BrowserSync dev server
_config.localserver = {
	port: 7890,
	server: {
		baseDir:    _config.paths.dest,
		middleware: [ historyApiFallback() ]
	}
}

// Webpack for build JS
_config.webpack = {
	cache: true,
	devtool: 'source-map',
	context: path.resolve(__dirname, _config.paths.src),
	entry: {
		client:     `./${_config.paths.js.client}`,
		background: `./${_config.paths.js.background}`,
	},
	output: {
		path:     path.resolve(__dirname, _config.paths.dest),
		filename: '[name].bundle.js',
	},

	resolve: {
		modules: [path.resolve(__dirname, './src/'), path.resolve(__dirname, './src/model'), 'node_modules']
	},

	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['env']
				}
			}
		}]
	}
}


/*
 * Dev Server
 */
gulp.task('dev_server', ['html','assets', 'css', 'webpack','watch'], ()=>{
	browserSync.init({
		port: 9977,
		server: {
			baseDir:    _config.paths.dest,
			middleware: [ historyApiFallback() ]
		}
	})
})

gulp.task('watch', ()=>{
	gulp.watch(_config.paths.src+'/**/*.less', ['css']     )
	gulp.watch(_config.paths.src+'/*.html',    ['html']    )
	gulp.watch( _config.paths.js_all,          ['webpack'] )

	for(let k in _config.paths.assets){
		gulp.watch(k, ['assets'] )
	}
})

gulp.task('webpack', ()=>{
	return gulp.src( _config.paths.js_all )
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(webpackStream(_config.webpack, webpack2))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest( _config.paths.dest ))
		.pipe(browserSync.reload({ stream:true }))
})

gulp.task('html', ()=>{
	return gulp.src([ _config.paths.src + '/*.html'])
	.pipe(replace('{{timestamp}}', (new Date().getTime())))
	.pipe(gulp.dest( _config.paths.dest))
	.pipe(browserSync.reload({ stream:true }))
})

gulp.task('css', ()=>{
	return gulp.src( _config.paths.src+'/styles.less' )
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(prefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest( _config.paths.dest+'/' ))
		.pipe(browserSync.reload({ stream:true }))
})




/*
 * Production build
 */
gulp.task('clean', ()=>{
	return gulp.src(_config.paths.dest+'/*', { read: false })
			.pipe(clean())
})

// Build optimize JS
gulp.task('webpack_prod', ()=>{
	_config.webpack.plugins = [
		new webpack2.LoaderOptionsPlugin({
			minimize: true,
			debug: false
		}),
		// new webpack2.optimize.UglifyJsPlugin({
		// 	beautify: false,
		// 	mangle: {
		// 		screw_ie8: true,
		// 		keep_fnames: true
		// 	},
		// 	compress: {
		// 		screw_ie8: true
		// 	},
		// 	comments: false
		// })
	]

	return gulp.src( _config.paths.js_all )
	.pipe(webpackStream(_config.webpack, webpack2))
	.pipe(gulp.dest( _config.paths.dest ))
})

// Minified html
gulp.task('html_prod', ()=>{
	return gulp.src([ _config.paths.src + '/*.html'])
	.pipe(minifyHTML({quotes: true}))
	.pipe(replace('{{timestamp}}', (new Date().getTime())))
	.pipe(gulp.dest( _config.paths.dest))
})

// Minified css
gulp.task('css_prod', ()=>{
	return gulp.src( _config.paths.css )
		.pipe(less())
		.pipe(prefixer())
		.pipe(cleanCSS({
			compatibility: 'ie8',
			debug: true
		}))
		.pipe(gulp.dest( _config.paths.dest+'/' ))
})



// Перенос статики в билд без изменений
gulp.task('assets', ()=>{
	for(let k in _config.paths.assets){
		gulp.src( k ).pipe(gulp.dest( _config.paths.assets[k] ))
	}
})
