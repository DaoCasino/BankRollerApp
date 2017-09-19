module.exports = {
	'env': {
        'browser':  true,
        'commonjs': true,
        'es6':      true
    },

    'parserOptions': {
    	'ecmaVersion'  : 8,
        'ecmaFeatures': {
            'jsx': true
        },
        'sourceType': 'module'
    },

    'globals': {
        'riot':      true,
        '__dirname': true,
        'process':   true,
        'App':       true,
        '$':         true
    },

    'plugins': ['riot','flowtype'],

    'rules': {
    	// http://eslint.org/docs/rules/indent#options
        'indent': [
            'warn',
            'tab' // 2
        ],
        'linebreak-style': [
            'warn',
            'unix'
        ],

        // http://eslint.org/docs/rules/quotes#options
        'quotes': [
            'warn',
            'single' // 'double'
        ],

        // http://eslint.org/docs/2.0.0/rules/semi#options
        'semi': [
            'warn',
            'never' // 'always'
        ]
    }
}
