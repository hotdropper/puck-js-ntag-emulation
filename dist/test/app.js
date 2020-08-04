'use strict';

class Other {
  constructor() {
    console.log('construct');
  }

  doFoo() {
    console.log('doFoo');
  }

}

var storage = require('Storage');

console.log('test'); // setInterval(() => console.log('hello'), 5000);

var o = new Other();
o.doFoo();