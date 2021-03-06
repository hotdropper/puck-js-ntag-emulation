'use strict';
/**
 * String.prototype.padStart() polyfill
 * https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
 */

if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength = targetLength >> 0; //truncate if number or convert non-number to 0;

    padString = String(typeof padString !== 'undefined' ? padString : ' ');

    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;

      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
      }

      return padString.slice(0, targetLength) + String(this);
    }
  };
}
/**
 * String.prototype.padStart() polyfill
 * https://github.com/uxitten/polyfill/blob/master/string.polyfill.js
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
 */


if (!String.prototype.padEnd) {
  String.prototype.padEnd = function padEnd(targetLength, padString) {
    targetLength = targetLength >> 0; //floor if number or convert non-number to 0;

    padString = String(typeof padString !== 'undefined' ? padString : ' ');

    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;

      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
      }

      return String(this) + padString.slice(0, targetLength);
    }
  };
}
/**
 * @typedef {Function} getTime
 * @returns {number}
 */


class Debugger {
  static debug(fn) {
    if (this.enabled) {
      fn();
    }
  }

  static enable() {
    this.enabled = true;
  }

  static disable() {
    this.enabled = false;
  }

}

Debugger.enabled = false;

class TagGen {
  static wipeData(data) {
    data.set([0x04, 0x25, 0x70, 0xD9, 0x6A, 0x4B, 0x68, 0x81], 0);
    data.set([0xC8, 0x48, 0x00, 0x00, 0xE1, 0x10, 0x3E, 0x00], 8);
    data.set([0x03, 0x00, 0xFE, 0x00, 0x00, 0x00, 0x00, 0x00], 16);

    for (var i = 24; i < 520; i = i + 8) {
      data.set([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], i);
    }

    data.set([0x00, 0x00, 0x00, 0xBD, 0x04, 0x00, 0x00, 0xFF], 520);
    data.set([0x00, 0x05, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF], 528);
    data.set([0x00, 0x00, 0x00, 0x00, 0xFA, 0x93, 0xAA, 0xE0], 536);
    data.set([0x1D, 0xFF, 0x87, 0xEF, 0x82, 0x5B, 0x27, 0x57], 544);
    data.set([0x2A, 0x02, 0x21, 0x8C, 0xE8, 0x54, 0xD3, 0x0B], 552);
    data.set([0x9F, 0x91, 0xAF, 0x17, 0x05, 0x5A, 0xF2, 0x3F], 560);
    data.set([0x50, 0x5A, 0xE2, 0x30, 0x00, 0x04, 0x04, 0x02], 568);
    data.set([0x01, 0x00, 0x11, 0x03], 576);
  }
  /**
   *
   * @returns {Uint8Array}
   */


  static generateData() {
    var newTagData = new Uint8Array(580);
    this.wipeData(newTagData);
    return newTagData;
  }

}
/* Copyright (c) 2020 Daniel Radtke. See the file LICENSE for copying permission. */


var Storage = require("Storage");

var staticResponses = {
  nak: {
    invalid_argument: 0,
    invalid_crc: 1,
    auth_lockout: 4,
    eeprom_error: 5
  },
  atqa: new Uint8Array([0x00, 0x44]),
  sak: new Uint8Array(0x00),
  ack: new Uint8Array(0x0A),
  backdoorOpened: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
  backdoorClosed: new Uint8Array([0x04, 0x03, 0x02, 0x01])
};

function NFCTag(data) {
  this.led = [];
  this.filename = null;
  this.authenticated = false;
  this.backdoor = false;
  this.tagWritten = false;
  this.pwdLockout = false;
  this.lockedPages = {};
  this._responses = {};
  this.setData(data);
}

NFCTag.prototype = {
  start: function () {
    NRF.nfcStart(new Uint8Array([this._data[0], this._data[1], this._data[2], this._data[4], this._data[5], this._data[6], this._data[7]]));
  },
  stop: function () {
    NRF.nfcStop();
  },
  activate: function () {
    for (var i = 0; i < this.led.length; i++) {
      digitalWrite(this.led[i], 1);
    }
  },
  deactivate: function () {
    for (var i = 0; i < this.led.length; i++) {
      digitalWrite(this.led[i], 0);
    }

    this.authenticated = false;
    this.backdoor = false;

    if (this.tagWritten === true) {
      if (this.fileData) {
        this.fileData.save();
      } //console.log("Saving tag to flash");
      //require("Storage").write(filename, this._data);


      this.tagWritten = false;
    }
  },
  receive: function (rx) {
    if (rx && this._callbacks[rx[0]]) {
      this._callbacks[rx[0]](rx, this);
    } else {
      NRF.nfcSend(staticResponses.nak.invalid_argument);
    }
  },
  _initCard: function () {
    var _this = this;

    var pwStart = 0x85 * 4;
    this._info.password = new Uint8Array(this._data.buffer, pwStart - 1, 5);
    this._info.password[0] = 0x1b;
    var packStart = 0x86 * 4;
    this._responses.pack = new Uint8Array(this._data.buffer, packStart, 2);

    if (this._data.length > 540) {
      this._responses.signature = new Uint8Array(this._data.buffer, 540, 32);
    }

    if (this._data.length > 572) {
      this._responses.version = new Uint8Array(this._data.buffer, 572, 8);
    } else {
      this._responses.version = new Uint8Array([0x00, 0x04, 0x04, 0x02, 0x01, 0x00, 0x11, 0x03]);
    }

    Debugger.debug(function () {
      console.log('password', _this._info.password);
      console.log('pack', _this._responses.pack);
      console.log('signature', _this._responses.signature);
      console.log('version', _this._responses.version);
    });

    this._fixUid();

    this.lockedPages = this._getLockedPages();
  },
  _fixUid: function () {
    var _this2 = this;

    var bcc0 = this._data[0] ^ this._data[1] ^ this._data[2] ^ 0x88;
    var bcc1 = this._data[4] ^ this._data[5] ^ this._data[6] ^ this._data[7];
    Debugger.debug(function () {
      var uidBlock = "";

      for (var i = 0; i < 9; i++) {
        uidBlock += _this2._data[i].toString(16) + " ";
      }

      console.log(uidBlock);
      console.log(bcc0.toString(16) + " " + bcc1.toString(16));
    });

    if (this._data[3] !== bcc0 || this._data[8] !== bcc1) {
      this._data[3] = bcc0;
      this._data[8] = bcc1;
      console.log("Fixed bad bcc");
      return true;
    }

    return false;
  },
  _getLockedPages: function () {
    var locked = [0, 1]; // Static Lock Bytes

    for (var bit = 0; bit < 8; bit++) {
      if (this._data[11] & 1 << bit) {
        locked.push(bit + 8);
      }

      if (this._data[10] & 1 << bit) {
        switch (bit) {
          case 0: //BL-CC

          case 1: //BL-9-4

          case 2: //BL-15-10

          case 3:
            //L-CC
            break;

          default:
            locked.push(bit + 4);
        }
      }
    }

    if (!this.authenticated) {
      // Dynamic Lock Bytes
      if (this._data[520] & 0b00000001 > 0) {
        locked.push(16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31);
      }

      if (this._data[520] & 0b00000010 > 0) {
        locked.push(32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47);
      }

      if (this._data[520] & 0b00000100 > 0) {
        locked.push(48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63);
      }

      if (this._data[520] & 0b00001000 > 0) {
        locked.push(64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79);
      }

      if (this._data[520] & 0b00010000 > 0) {
        locked.push(80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95);
      }

      if (this._data[520] & 0b00100000 > 0) {
        locked.push(96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111);
      }

      if (this._data[520] & 0b01000000 > 0) {
        locked.push(112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127);
      }

      if (this._data[520] & 0b10000000 > 0) {
        locked.push(128, 129);
      }
    }

    var pages = {};
    locked.forEach(function (page) {
      pages[page] = true;
    });
    return pages;
  },
  _readPage: function (page) {
    if (this.backdoor === false && (page < 0 || page > 134)) {
      return staticResponses.nak.invalid_argument;
    }

    if (!this.backdoor && (page === 133 || page === 134)) {
      return new Uint8Array(4);
    } // reads on the MFU cards send back 16 bytes...
    // this also fixes the signature validation issue I was seeing.
    // I suspect the data beyond page 134 is 'undefined' and we don't have to worry about it.
    // In practice, it looks like the data returned when you ask for page 134 is:
    // [4 bytes page 134] + [first 12 bytes of tag]
    //send response


    return new Uint8Array(this._data.buffer, page * 4, 16);
  },
  _info: {
    password: [0x1b, 0x00, 0x00, 0x00, 0x00]
  },
  _callbacks: {
    0x30: function read(rx, self) {
      NRF.nfcSend(self._readPage(rx[1]));
    },
    0xa2: function write(rx, self) {
      if (!this.backdoor && (rx[1] > 134 || self.lockedPages[rx[1]])) {
        NRF.nfcSend(staticResponses.nak.invalid_argument);
        Debugger.debug(function () {
          console.log('write blocked');
        });
        return;
      }

      if (!this.backdoor) {
        if (rx[1] === 2) {
          self._data[10] = self._data[10] | rx[4];
          self._data[11] = self._data[11] | rx[5];
          NRF.nfcSend(0x0a);
          return;
        }

        if (rx[1] === 3) {
          self._data[16] = self._data[16] | rx[2];
          self._data[17] = self._data[17] | rx[3];
          self._data[18] = self._data[18] | rx[4];
          self._data[19] = self._data[19] | rx[5];
          NRF.nfcSend(0x0a);
          return;
        }

        if (rx[1] === 130) ;
      } //calculate block index


      var idx = rx[1] * 4; //store data if it fits into memory

      if (idx > self._data.length) {
        NRF.nfcSend(staticResponses.nak.invalid_argument);
      } else {
        var view = new Uint8Array(rx, 2, 4);

        self._data.set(view, idx);

        NRF.nfcSend(0x0a);
      }

      self.tagWritten = true;
    },
    0x60: function version(rx, self) {
      NRF.nfcSend(self._responses.version);
    },
    0x3a: function fastRead(rx, self) {
      // no need for a < 0 check, these are unsigned ints...
      if (rx[1] > rx[2] || rx[2] > 134) {
        NRF.nfcSend(staticResponses.nak.invalid_argument);
        Debugger.debug(function () {
          console.log("Invalid fast read command");
        });
        return;
      }

      if (rx[1] === 133 && rx[2] === 134) {
        if (!self.backdoor) {
          NRF.nfcSend(staticResponses.backdoorOpened);
          self.backdoor = true;
        } else {
          if (self.tagData) {
            NRF.nfcSend(staticResponses.backdoorClosed);
            self.backdoor = false;
            setTimeout(function () {
              self.tagData.save();
              self.stop();

              self._initCard();

              self.start();
            }, 0);
          }
        }

        return;
      }

      NRF.nfcSend(new Uint8Array(self._data, rx[1] * 4, (rx[2] - rx[1] + 1) * 4));
    },
    0x1b: function pwdAuth(rx, self) {
      if (self._info.password !== rx) {
        NRF.nfcSend(self.pwdLockout ? staticResponses.nak.auth_lockout : staticResponses.nak.invalid_argument);
        console.log("Auth fail.");
        return;
      }

      NRF.nfcSend(self._responses.pack);
      self.authenticated = true;
      console.log('Authenticated.');
    },
    0x3c: function readSig(rx, self) {
      NRF.nfcSend(self._responses.signature);
    },
    0x88: function restartNfc(rx, self) {
      self.setData(self._data);
    },
    0x1a: function keepAlive() {
      NRF.nfcSend();
    },
    0x93: function keepAlive() {
      NRF.nfcSend();
    }
  },
  setData: function (data) {
    //shutdown
    this.stop();

    if (data instanceof TagDataFile) {
      this.led = data.led;
      this.filename = data.filename;
      this._data = data.buffer;
      this.tagData = data;
    } else if (data instanceof TagData) {
      this.tagData = data;
      this._data = data.buffer;
    } else if (data instanceof Uint8Array) {
      this._data = data;
    } else if (data instanceof ArrayBuffer) {
      this._data = new Uint8Array(data);
    } else {
      var err = new Error("Invalid argument");
      err.Data = {
        data: data
      };
    } // init card and fix bcc0 and bcc1 if needed


    this._initCard(); //re-start


    this.start();
  },
  getData: function () {
    return this._data;
  }
};

class TagData {
  /**
   *
   * @param {Uint8Array} buffer
   */
  constructor(buffer) {
    this.buffer = buffer || TagGen.generateData();
  }

}

class TagDataFile extends TagData {
  constructor(led, filename) {
    super();
    this.led = led;
    this.filename = filename;
    var fileBuff = Storage.readArrayBuffer(filename);

    if (fileBuff) {
      var minLen = fileBuff.length > this.buffer.length ? this.buffer.length : fileBuff.length;

      for (var buffPos = 0; buffPos < minLen; buffPos++) {
        this.buffer[buffPos] = fileBuff[buffPos];
      }
    }
  }

}

TagData.prototype.save = function () {// no op
};

TagDataFile.prototype.save = function () {// Storage.write(this.filename, this.buffer);
};

var tags = function () {
  var leds = [{
    led: [LED1]
  }, // { led: [LED1, LED2] },
  // { led: [LED2] },
  // { led: [LED2, LED3] },
  {
    led: [LED3]
  }];
  var data = [];

  for (var i = 0; i < leds.length; i++) {
    var filename = "tag" + i + ".bin";
    data[i] = new TagDataFile(leds[i].led, filename);
  }

  return data;
}();

var currentTag = 0;
var tag = new NFCTag(tags[currentTag]);
NRF.on('NFCon', function () {
  tag.activate();
});
NRF.on('NFCoff', function () {
  setTimeout(function () {
    return tag.deactivate();
  }, 0);
});
NRF.on('NFCrx', function (rx) {
  tag.receive(rx);
}); // NFCLogger.attach(NRF);

setWatch(function () {
  tag.stop(); // tags[currentTag].save();

  currentTag++;

  if (currentTag > tags.length - 1) {
    currentTag = 0;
  }

  tag.led = tags[currentTag].led;
  LED1.write(0);
  LED2.write(0);
  LED3.write(0);

  for (var i = 0; i < tag.led.length; i++) {
    digitalWrite(tag.led[i], 1);
  }

  tag = new NFCTag(tags[currentTag]);
  setTimeout(function () {
    for (var _i = 0; _i < tag.led.length; _i++) {
      digitalWrite(tag.led[_i], 0);
    }
  }, 200);
}, BTN, {
  repeat: true,
  edge: "rising",
  debounce: 50
}); //process.on('uncaughtException', function(e) { console.log(e); });