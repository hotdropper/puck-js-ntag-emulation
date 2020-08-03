const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  externals: {
    Storage: 'require("Storage")'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["@babel/preset-env"]  //Preset used for env setup
          }
        }
      }
    ]
  },
  optimization: {
    minimize: false,
    // minimizer: [
    //   new UglifyJsPlugin({
    //     cache: true,
    //     parallel: true,
    //     uglifyOptions: {
    //       compress: false,
    //       ecma: 5,
    //       mangle: false // Disable name mangling to avoid this issue: https://github.com/espruino/Espruino/issues/1367
    //     },
    //     sourceMap: true
    //   })
    // ]
  },
};
