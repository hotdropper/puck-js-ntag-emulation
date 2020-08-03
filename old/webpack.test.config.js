const path = require('path');

const original = require('./webpack.config');
original.entry = ['./src/test/app.js'];
original.output = {
  path: path.resolve(__dirname, 'dist'),
  filename: 'test.bundle.js',
};

module.exports = original;
