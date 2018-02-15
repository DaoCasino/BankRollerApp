module.exports = {
    'extends': 'standard',
    
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
       'route':     true,
       '__dirname': true,
       'process':   true,
       'App':       true,
       '$':         true
   },

    'plugins': ['riot'],

    'rules': {
        'no-multi-spaces'              : ['off'],
        'key-spacing'                  : ['off'],
        'camelcase'                    : ['off'],
        'standard/no-callback-literal' : ['off'],
        'semi'                         : ['warn'],
        'no-tabs'                      : ['warn'],
        'no-irregular-whitespace'      : ['warn'],
        'new-cap'                      : ['warn'],
        'keyword-spacing'              : ['warn'],
        'brace-style'                  : ['warn'],
        'comma-spacing'                : ['warn'],
        'spaced-comment'               : ['warn'],
        'no-mixed-spaces-and-tabs'     : ['warn'],
        'arrow-spacing'                : ['warn'],
        'space-unary-ops'              : ['warn'],
        'eol-last'                     : ['warn'],
        'comma-dangle'                 : ['warn'],
        'space-infix-ops'              : ['warn'],
        'no-trailing-spaces'           : ['warn'],
        'no-multiple-empty-lines'      : ['warn'],
        'space-in-parens'              : ['warn'],
        'space-before-function-paren'  : ['warn'],
        'space-before-blocks'          : ['warn'],
        'padded-blocks'                : ['warn'],
        'indent'                       : ['warn']
    }
}