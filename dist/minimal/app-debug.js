'use strict';

class TagGen {
  /**
   *
   * @param {Uint8Array} data
   */
  static wipe(data) {
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


  static generate() {
    var newTagData = new Uint8Array(584);
    this.wipe(newTagData);
    return newTagData;
  }
  /**
   *
   * @param {NFCTag} tag
   * @param {number} [bytesPerLine] Defaults to 4 bytes (a page).
   */


  static export(tag, bytesPerLine) {
    bytesPerLine = bytesPerLine || 4;
    console.log('tag._data = new Uint8Array(584);');
    console.log('var s = (i, d) => tag._data.set(d, i * 4);');

    for (var i = 0; i < tag._data.length; i += bytesPerLine) {
      var bytes = tag._data.slice(i, i + bytesPerLine);

      var line = bytes.map(function (b) {
        return (b < 16 ? '0' : '') + b.toString(16);
      }).join(', 0x');
      console.log('s(' + i / 4 + ', [0x' + line + ']);');
    }

    console.log('delete s;');
    console.log('tag.restart();');
  }

}

class LedDancer {
  /**
   *
   * @param {LED[]|LED} leds
   * @param {number} interval
   * @param {number} times
   * @param {Function} [onComplete]
   */
  static dance(leds, interval, times, onComplete) {
    if (leds instanceof Pin) {
      leds = [leds];
    }

    var state = 0;
    var count = 0;

    var progress = function () {
      state = Math.abs(state - 1);
      leds.forEach(function (pin) {
        return pin.write(state);
      });

      if (state === 1) {
        count++;
      }

      if (count < times || state === 1) {
        setTimeout(progress, interval);
      } else if (onComplete) {
        onComplete();
      }
    };

    setTimeout(progress, interval);
  }

}
/**
 * @param {number} delayBetweenClicks
 * @param {Object<number, Function>} actions
 */


function wireUp(delayBetweenClicks, actions) {
  var leds = [LED1, LED2, LED3];
  E.on('init', function () {
    leds.forEach(function (p) {
      return p.write(0);
    });
  });
  /**
   *
   * @param {number} rebootAtCount
   */

  function rebootPuck(rebootAtCount) {
    LedDancer.dance(leds, 1000, rebootAtCount, function () {
      leds.forEach(function (p) {
        return p.write(1);
      });
      E.reboot();
    });
  }

  var lastClick = null;
  var clickTimeout = null;
  var buttonClicks = 0;
  actions = actions || {};

  if (actions[3]) {
    if (actions[3] instanceof Array) {
      actions[3].push(function () {
        return rebootPuck(3);
      });
    } else {
      actions[3] = [actions[3], function () {
        return rebootPuck(3);
      }];
    }

    console.log('Warning: the action(s) on 3 clicks will run just before the puck reboots.');
  } else {
    actions[3] = function () {
      return rebootPuck(3);
    };
  }

  var handleButtonClick = function () {
    if (!actions[buttonClicks]) {
      LedDancer.dance(leds, 250, 2);
    } else if (actions[buttonClicks] instanceof Array) {
      actions[buttonClicks].forEach(function (bc) {
        return bc();
      });
    } else {
      actions[buttonClicks]();
    }

    clickTimeout = null;
    buttonClicks = 0;
    lastClick = null;
  };

  setWatch(function () {
    if (lastClick !== null && getTime() - lastClick < delayBetweenClicks) {
      clearTimeout(clickTimeout);
    }

    buttonClicks++;
    lastClick = getTime();
    clickTimeout = setTimeout(handleButtonClick, delayBetweenClicks);
  }, BTN, {
    repeat: true,
    edge: "rising",
    debounce: 50
  });
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
    this._pages[0xFC] = new Uint8Array(this._data.buffer, 580, 4); // Debugger.debug(() => {
    //     console.log('password', this._info.password);
    //     console.log('pack', this._responses.pack);
    //     console.log('signature', this._responses.signature);
    //     console.log('version', this._responses.version);
    // });
  }

  _fixUid() {
    var bcc0 = this._data[0] ^ this._data[1] ^ this._data[2] ^ 0x88;
    var bcc1 = this._data[4] ^ this._data[5] ^ this._data[6] ^ this._data[7]; // Debugger.debug(() => {
    //     let uidBlock = "";
    //     for (let i = 0; i < 9; i++) {
    //         uidBlock += this._data[i].toString(16)+ " ";
    //     }
    //     console.log(uidBlock);
    //     console.log(bcc0.toString(16) + " " + bcc1.toString(16));
    // });

    if (this._data[3] !== bcc0 || this._data[8] !== bcc1) {
      this._data[3] = bcc0;
      this._data[8] = bcc1;
      console.log("Fixed bad bcc");
      return true;
    }

    return false;
  }

}

var tagData = TagGen.generate();
var tag = new NFCTag(LED1, tagData);
var oldNfcSend = NRF.nfcSend;

NRF.nfcSend = function (tx) {
  return oldNfcSend(tx);
};

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
  e) {} // idleMonitor.tick();

}

NRF.on('NFCrx', function (rx) {
  processRx(rx);
});
tag.start();
wireUp(1000, {
  1: function () {
    tag.stop();
    LED2.write(1);

    tag._initCard();

    setTimeout(function () {
      tag.start();
      LED2.write(0);
    }, 200);
  },
  3: function () {
    return console.log('Rebooting...');
  }
}); // console.log(NFCLogger.attach.toString());
// NFCLogger.attach(NRF);
// NFCLogger.stop();
//process.on('uncaughtException', function(e) { console.log(e); });