module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    // "extends": "eslint:recommended",
     // "extends": [
        // "eslint:recommended"
    // ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": false
        },
        "sourceType": "module"
    },
    "globals": {
        "__dirname": true,
        "process": true,
        "App": true,
        "$": true,
    },

    "plugins": ["riot"],
    "rules": {
        "indent": [
            "warn",
            "tab"
        ],
        "linebreak-style": [
            "warn",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "never"
        ]
    }
};
