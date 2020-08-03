const path = require('path');

const original = require('./webpack.config');
original.entry = ['./src/original-ntag/app.js'];
original.output = {
  path: path.resolve(__dirname, 'dist'),
  filename: 'original.bundle.js',
};

module.exports = original;
