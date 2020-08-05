module.exports = {
    "presets": [
        ["babel-preset-espruino", {}],
    ],
    "plugins": [
        [
            'module-resolver',
            {
                root: "./src/",
                alias: {
                    'core-js': './node_modules/core-js',
                },
            },
        ],
    ]
}
