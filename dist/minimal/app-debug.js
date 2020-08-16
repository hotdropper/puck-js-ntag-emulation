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

class IdleDetector {
  constructor(name, whenIdleFor, doAction) {
    this.name = name;
    this.interval = whenIdleFor / 2;
    this.doAction = doAction;
    this.timeoutRef = null;
    this.ticks = 0;
    this.lastTick = null;
    this.actionTick = 0;
    this.enabled = false;
  }

  enable(interval) {
    if (interval) {
      this.interval = interval;
    }

    this.enabled = true;
    this.registerTimeout();
  }

  disable() {
    this.enabled = false;

    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
  }

  tick() {
    if (this.enabled) {
      this.ticks++;
    }
  }

  monitor() {
    // console.log('monitor check', this.name);
    if (this.lastTick !== this.ticks) {
      this.lastTick = this.ticks;
      return this.registerTimeout();
    }

    if (this.ticks !== this.actionTick) {
      this.actionTick = this.ticks;
      this.doAction();
    }

    return this.registerTimeout();
  }

  registerTimeout() {
    var _this = this;

    if (this.timeoutRef) {
      return;
    }

    this.timeoutRef = setTimeout(function () {
      _this.timeoutRef = null;

      _this.monitor();
    }, this.interval);
  }

}
/**
 * @typedef {Function} getTime
 * @returns {number}
 */


var MAX_ELEMENTS_PER_ROW = 16;
var TABLE_PAD_MIDDLE = MAX_ELEMENTS_PER_ROW * 3 + 2;
var TABLE_PAD_END = 15;
var annotations = {
  rx: {
    0xA2: function (data) {
      return 'WRITE(' + data[1].toString('16').padStart(2, '0') + ')';
    },
    0xA0: function (data) {
      return 'COMP_WRITE(' + data[1].toString('16').padStart(2, '0') + ')';
    },
    0x1B: function () {
      return 'PWD_AUTH';
    },
    0x30: function (data) {
      return 'READ(' + data[1].toString('16').padStart(2, '0') + ')';
    },
    0x3C: function () {
      return 'READ_SIG';
    },
    0x60: function () {
      return 'GET_VERSION';
    },
    0x39: function (data) {
      return 'READ_CNT(' + data[1].toString('16').padStart(2, '0') + ')';
    },
    0x3A: function (data) {
      return 'FAST_READ(' + data[1].toString('16').padStart(2, '0') + ' => ' + data[2].toString('16').padStart(2, '0') + ')';
    }
  },
  tx: {
    0x00: function (data) {
      return data.length === 0 ? 'NAK_INVALID_ARG' : null;
    },
    0x01: function (data) {
      return data.length === 0 ? 'NAK_CRC' : null;
    },
    0x04: function (data) {
      return data.length === 0 ? 'NAK_AUTH_LOCKOUT' : null;
    },
    0x05: function (data) {
      return data.length === 0 ? 'NAK_EEPROM_ERROR' : null;
    },
    0x0A: function (data) {
      return data.length === 0 ? 'ACK' : null;
    }
  }
};

class NFCLogger {
  static attach() {
    if (NFCLogger.attached === true) {
      return;
    }

    NFCLogger.attached = true; // this might be kinda confusing, but best practice is:
    // call attach() AFTER you have registered your primary handler
    // that way your request/response gets priority, and logging
    // comes afterwards. Unfortunately, this ALSO means that the logger
    // ends up getting your /response/ before it gets the /transmission/
    // so we store the response and then add it after the received data
    // in our NFCrx handler.

    NFCLogger.heldResponses = [];
    /**
     *
     * @param {Uint8Array} data
     */

    NRF.nfcSend = function (data) {
      // setTimeout(() => console.log('Sending', data), 250);
      NFCLogger.originalNfcSend.call(NRF, data);

      if (NFCLogger.tracking === false) {
        return;
      }

      if (data instanceof Uint8Array) {
        NFCLogger.heldResponses.push({
          type: 'tx',
          data: data
        });
      } else if (data instanceof Number) {
        NFCLogger.heldResponses.push({
          type: 'tx',
          data: new Uint8Array([data])
        });
      } else {
        NFCLogger.heldResponses.push({
          type: 'tx',
          data: new Uint8Array(0)
        });
      }

      NFCLogger.idleDetector.tick();
    };

    NRF.on('NFCrx', function (rx) {
      return NFCLogger._receive(rx);
    });
  }
  /**
   *
   * @param {Uint8Array} rx
   * @listens NRF~event:NFCrx
   * @private
   */


  static _receive(rx) {
    if (NFCLogger.tracking === false) {
      return;
    }

    NFCLogger.log.push({
      type: 'rx',
      data: new Uint8Array(rx)
    });

    if (NFCLogger.heldResponses.length > 0) {
      NFCLogger.log.push(NFCLogger.heldResponses.shift());
    }

    NFCLogger.idleDetector.tick();
  }

  static stop() {
    NFCLogger.tracking = false;
    NFCLogger.idleDetector.disable();
  }

  static start(timeout) {
    NFCLogger.idleDetector.enable(timeout || 5000);
    NFCLogger.tracking = true;
  }

  static _monitor() {
    NFCLogger._printLogHeading();

    NFCLogger.log.forEach(function (log) {
      NFCLogger._printLogEntry(log);
    });
    NFCLogger.log = [];
    NFCLogger.lastCount = NFCLogger.count;
  }

  static _printLogHeading() {
    // let line = "Time |".padStart(TABLE_PAD_START, " ");
    var line = " Src | ";
    line += " Data ".padEnd(TABLE_PAD_MIDDLE, " ") + " |";
    line += " Annotation";
    console.log(line);
    console.log("-".repeat(5) + "|-" + "-".repeat(TABLE_PAD_MIDDLE) + "-|" + "-".repeat(TABLE_PAD_END));
  }
  /**
   *
   * @param {LogEntry} logEntry
   * @private
   */


  static _printLogEntry(logEntry) {
    if (!logEntry.data) {
      logEntry.data = new Uint8Array([]);
    } // let line = Math.round(logEntry.time).toString().padEnd(1, " ").padStart(TABLE_PAD_START);


    for (var i = 0; i < logEntry.data.length; i += MAX_ELEMENTS_PER_ROW) {
      var line = " " + (i === 0 ? logEntry.type === 'rx' ? 'Rdr' : 'Tag' : '   ') + ' | ';
      var chunk = [];
      var end = i + MAX_ELEMENTS_PER_ROW;

      if (end > logEntry.data.length) {
        end = logEntry.data.length - i;
      } else {
        end = MAX_ELEMENTS_PER_ROW;
      } // console.log({ i: i, end: end });


      chunk = new Uint8Array(logEntry.data.buffer, logEntry.data.byteOffset + i, end); // chunk.forEach(c => console.log(JSON.stringify(c)));

      var chunkStr = ' ';
      chunk.forEach(function (c) {
        chunkStr += c.toString(16).toUpperCase().padStart(2, '0') + ' ';
      });
      chunkStr = chunkStr.padEnd(TABLE_PAD_MIDDLE) + " |";
      var annotation = annotations[logEntry.type][logEntry.data[0]] ? annotations[logEntry.type][logEntry.data[0]](logEntry.data) : null;

      if (i === 0 && annotation) {
        line += chunkStr + " " + annotation;
      } else {
        line += chunkStr;
      }

      console.log(line);
    }
  }

}

NFCLogger.originalNfcSend = NRF.nfcSend;
NFCLogger.idleDetector = new IdleDetector('log watch', 5000, function () {
  NFCLogger._monitor();
});
NFCLogger.tracking = false;
/** @var {LogEntry[]} */

NFCLogger.log = [];
/** @var {LogEntry[]} */

NFCLogger.heldResponses = [];

class Debugger {
  static debug(fn) {
    if (this.isEnabled()) {
      fn();
    }
  }

  static isEnabled() {
    return this.enabled === true;
  }

  static enable() {
    this.enabled = true;
  }

  static disable() {
    this.enabled = false;
  }
  /**
   *
   * @param {NFCTag} tag
   * @param {number} bytesPerLine
   */


  static exportTag(tag, bytesPerLine) {
    bytesPerLine = bytesPerLine || 16;
    console.log('tag._data = new Uint8Array(584);');
    console.log('var s = (i, d) => tag._data.set(d, i * 4);');

    for (var i = 0; i < tag._data.length; i += bytesPerLine) {
      var bytes = tag._data.slice(i, i + bytesPerLine);

      var line = bytes.map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join(', 0x');
      console.log('s(' + i / 4 + ', [0x' + line + ']);');
    }

    console.log('delete s;');
    console.log('tag.restart();');
  }

}

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
    data.set([0x01, 0x00, 0x00, 0x00], 580);
  }
  /**
   *
   * @returns {Uint8Array}
   */


  static generateData() {
    var newTagData = new Uint8Array(584);
    this.wipeData(newTagData);
    return newTagData;
  }

}
/* Copyright (c) 2020 Daniel Radtke. See the file LICENSE for copying permission. */


var staticResponses = {
  nak: {
    invalid_argument: 0,
    invalid_crc: 1,
    auth: 4,
    eeprom_error: 5
  },
  atqa: new Uint8Array([0x00, 0x44]),
  sak: 0x00,
  ack: 0x0A
};
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */

function write(self, rx) {
  // console.log('write', rx);
  if (self._pages[rx[1]]) {
    self._pages[rx[1]].set(new Uint8Array(rx, 2, 4), 0);

    if (self._dataChanged) {
      return self._staticResponses.ack;
    }

    self._dataChanged = true;
    LED3.write(1);
    return self._staticResponses.ack;
  } else {
    return self._staticResponses.nak.invalid_argument;
  }
}

var compatWriteAddr = null;
var compatWriteMsg = new Uint8Array(18);
compatWriteMsg[0] = 0xa2;
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */

function compatWrite(self, rx) {
  if (compatWriteAddr) {
    self._page[compatWriteMsg].set(new Uint8Array(rx, 0, 4), 0);

    compatWriteAddr = null;
    return self._staticResponses.ack;
  } else if (self._pages[rx[1]]) {
    compatWriteAddr = rx[1];
    return self._staticResponses.ack;
  }

  return self._staticResponses.nak.invalid_argument;
}
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */


function read(self, rx) {
  if (self._pages[rx[1]]) {
    var resp = new Uint8Array(16);
    resp.set(self._pages[rx[1]]);
    return resp;
  }

  return self._staticResponses.nak.invalid_argument;
}
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */


function readFast(self, rx) {
  if (self._pages[rx[1]] && self._pages[rx[2]]) {
    return new Uint8Array(self._data.buffer, rx[1] * 4, (rx[2] - rx[1] + 1) * 4);
  }

  return self._staticResponses.nak.invalid_argument;
}
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */


function readCounter(self, rx) {
  if (self._pages[rx[1]]) {
    return self._pages[rx[1]];
  }

  return self._staticResponses.nak.invalid_argument;
}
/**
 *
 * @param {NFCTag} self
 * @returns {number|Uint8Array}
 */


function readVersion(self) {
  return self._responses.version;
}
/**
 *
 * @param {NFCTag} self
 * @returns {number|Uint8Array}
 */


function readSignature(self) {
  return self._responses.signature;
}
/**
 *
 * @param {NFCTag} self
 * @param {ArrayBufferLike} rx
 * @returns {number|Uint8Array}
 */


function auth(self, rx) {
  if (new Uint8Array(rx, 1, 4) === tag._info.password) {
    return self._responses.pack;
  }

  return self._staticResponses.nak.auth;
}
/**
 *
 * @param {NFCTag} self
 * @returns {number|Uint8Array}
 */


function reload(self) {
  self.stop();
  self.start();
  return undefined;
}
/**
 *
 * @returns {number|Uint8Array}
 */


function keepAlive() {
  return undefined;
}
/**
 *
 * @returns {number|Uint8Array}
 */


function wupa() {
  return undefined;
}

var commands = {
  // read
  0x30: read,
  0x3a: readFast,
  0xa2: write,
  0xa0: compatWrite,
  0x60: readVersion,
  0x1b: auth,
  0x3c: readSignature,
  0x39: readCounter,
  0x88: reload,
  0x1a: keepAlive,
  0x93: keepAlive,
  0x52: wupa
};

class NFCTag {
  constructor(led, data) {
    this.led = led;
    this._data = data;
    this._info = {};
    this._dataChanged = false;
    this._responses = {};
    this._staticResponses = staticResponses;

    this._initCard();
  }

  start() {
    // console.log('NFC Starting...');
    NRF.nfcStart(this._info.uid);
  }

  stop() {
    // console.log('NFC Stopping...');
    NRF.nfcStop();
  }

  restart() {
    this.stop();

    this._initCard();

    this.start();
  }

  activate() {
    this.led.write(1);
  }

  deactivate() {
    this.led.write(0);
  }

  _initCard() {
    var _this2 = this;

    this._dataChanged = false;
    LED3.write(0);
    this._info.uid = new Uint8Array([this._data[0], this._data[1], this._data[2], this._data[4], this._data[5], this._data[6], this._data[7]]);
    var pwStart = 0x85 * 4;
    this._info.password = new Uint8Array(this._data.buffer, pwStart, 4);
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

    this._fixUid();

    this._pages = [];

    for (var i = 0; i < 135; i++) {
      var len = 16;

      if (i > 0x81) {
        len -= (i - 0x81) * 4;
      }

      if (len < 4) {
        this._pages[i] = new Uint8Array(4);
      } else {
        this._pages[i] = new Uint8Array(this._data.buffer, i * 4, len);
      }
    } // this is modeled after how the Magic NTag 21x does things


    this._pages[0xF0] = new Uint8Array(this._data.buffer, pwStart, 4);
    this._pages[0xF1] = new Uint8Array(this._data.buffer, packStart, 2); // signature piece 1 of 8

    this._pages[0xF2] = new Uint8Array(this._data.buffer, 540, 4);
    this._pages[0xF3] = new Uint8Array(this._data.buffer, 544, 4);
    this._pages[0xF4] = new Uint8Array(this._data.buffer, 548, 4);
    this._pages[0xF5] = new Uint8Array(this._data.buffer, 552, 4);
    this._pages[0xF6] = new Uint8Array(this._data.buffer, 556, 4);
    this._pages[0xF7] = new Uint8Array(this._data.buffer, 560, 4);
    this._pages[0xF8] = new Uint8Array(this._data.buffer, 564, 4);
    this._pages[0xF9] = new Uint8Array(this._data.buffer, 568, 4); // version piece 1 of 2

    this._pages[0xFA] = new Uint8Array(this._data.buffer, 572, 4); // version piece 2 of 2

    this._pages[0xFB] = new Uint8Array(this._data.buffer, 576, 4);
    this._pages[0xFC] = new Uint8Array(this._data.buffer, 580, 4);
    Debugger.debug(function () {
      console.log('password', _this2._info.password);
      console.log('pack', _this2._responses.pack);
      console.log('signature', _this2._responses.signature);
      console.log('version', _this2._responses.version);
    });
  }

  _fixUid() {
    var _this3 = this;

    var bcc0 = this._data[0] ^ this._data[1] ^ this._data[2] ^ 0x88;
    var bcc1 = this._data[4] ^ this._data[5] ^ this._data[6] ^ this._data[7];
    Debugger.debug(function () {
      var uidBlock = "";

      for (var i = 0; i < 9; i++) {
        uidBlock += _this3._data[i].toString(16) + " ";
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
  }

}

var tagData = TagGen.generateData();
var tag = new NFCTag(LED1, tagData); // const idleMonitor = new IdleDetector('card watch',10000, () => {
//     tag.restart();
// });
// idleMonitor.enable();

function processRx(rx) {
  try {
    if (compatWriteAddr) {
      NRF.nfcSend(commands[0xa0](tag, rx));
    } else if (rx && commands[rx[0]]) {
      NRF.nfcSend(commands[rx[0]](tag, rx));
    } else {
      NRF.nfcSend(staticResponses.nak.invalid_argument);
    }
  } catch (
  /** @var {Error} */
  e) {// NRF.nfcSend(staticResponses.nak.invalid_argument);
  } // idleMonitor.tick();

}

NRF.on('NFCrx', function (rx) {
  processRx(rx);
});
tag.start(); // console.log(NFCLogger.attach.toString());
// NFCLogger.attach(NRF);

NFCLogger.stop();
setWatch(function () {
  tag.stop();
  LED2.write(1);

  tag._initCard();

  setTimeout(function () {
    tag.start();
    LED2.write(0);
  }, 200);
}, BTN, {
  repeat: true,
  edge: "rising",
  debounce: 50
}); //process.on('uncaughtException', function(e) { console.log(e); });