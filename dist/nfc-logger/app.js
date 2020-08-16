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


var MAX_ELEMENTS_PER_ROW = 16;
var TABLE_PAD_MIDDLE = MAX_ELEMENTS_PER_ROW * 3 + 2;
var TABLE_PAD_END = 15;
var annotations = {};

class NfcLogr {
  static attach(NRF) {
    NfcLogr.tracking = false;
    NfcLogr.monitorInterval = null;
    NfcLogr.dispatcherRunning = false;
    NfcLogr.count = 0;
    NfcLogr.lastCount = 0;
    /** @var {LogEntry[]} */

    NfcLogr.log = [];
    NfcLogr.recentlyCommunicated = false;
    NfcLogr.oldNfcSend = NRF.nfcSend; // this might be kinda confusing, but best practice is:
    // call attach() AFTER you have registered your primary handler
    // that way your request/response gets priority, and logging
    // comes afterwards. Unfortunately, this ALSO means that the logger
    // ends up getting your /response/ before it gets the /transmission/
    // so we store the response and then add it after the received data
    // in our NFCrx handler.

    NfcLogr.heldResponses = [];
    /**
     *
     * @param {Uint8Array} data
     */

    NRF.nfcSend = function (data) {
      NfcLogr.oldNfcSend.call(NRF, data);
      NfcLogr.recentlyCommunicated = true;
      NfcLogr.heldResponses.push({
        type: 'tx',
        data: data
      });
    };

    NRF.on('NFCrx', function (rx) {
      return NfcLogr._receive(rx);
    });
  }
  /**
   *
   * @param {Uint8Array} rx
   * @listens NRF~event:NFCrx
   * @private
   */


  static _receive(rx) {
    this.recentlyCommunicated = true;
    this.log.push({
      type: 'rx',
      data: rx
    });

    if (this.heldResponses.length > 0) {
      this.log.push(this.heldResponses.shift());
    }

    this.count++;
  }

  static stop() {
    this.tracking = false;
    clearInterval(this.monitorInterval);
    this.monitorInterval = null;
  }

  static start(timeout) {
    var _this = this;

    if (this.monitorInterval) {
      return;
    }

    this.tracking = true;
    this.monitorInterval = setInterval(function () {
      _this._monitor();
    }, timeout || 5000);
  }

  static _monitor() {
    var _this2 = this;

    if (this.dispatcherRunning === true || this.tracking === false || this.count === this.lastCount) {
      return;
    }

    if (this.recentlyCommunicated) {
      this.recentlyCommunicated = false;
      return;
    }

    this.dispatcherRunning = true;

    this._printLogHeading();

    this.log.forEach(function (log) {
      _this2._printLogEntry(log);
    });
    this.log = [];
    this.lastCount = this.count;
    this.dispatcherRunning = false;
  }

  static _printLogHeading() {
    // let line = "Time |".padStart(TABLE_PAD_START, " ");
    var line = " Src |";
    line += " Data ".padEnd(TABLE_PAD_MIDDLE, " ") + "|";
    line += " Annotation";
    console.log(line);
    console.log("-".repeat(5) + "|" + "-".repeat(TABLE_PAD_MIDDLE) + "|" + "-".repeat(TABLE_PAD_END));
  }
  /**
   *
   * @param {LogEntry} logEntry
   * @private
   */


  static _printLogEntry(logEntry) {
    if (!logEntry.data) {
      logEntry.data = [0x0A];
    } // let line = Math.round(logEntry.time).toString().padEnd(1, " ").padStart(TABLE_PAD_START);


    var line = " " + (logEntry.type === 'rx' ? 'Rdr' : 'Tag') + ' | ';

    for (var i = 0; i < logEntry.data.length; i += MAX_ELEMENTS_PER_ROW) {
      var chunk = [];

      if (logEntry.data instanceof Uint8Array) {
        chunk = new Uint8Array(logEntry.data.buffer, i, MAX_ELEMENTS_PER_ROW);
      } else if (logEntry.data instanceof Array) {
        chunk = logEntry.data.slice(i, MAX_ELEMENTS_PER_ROW);
      } else {
        chunk = [logEntry.data.toString()];
      }

      var chunkStr = (" " + chunk.map(function (c) {
        return parseInt(c).toString(16);
      }).join(' ') + " ").replace(/ ([0-9a-zA-Z]) /g, '0$1').padEnd(TABLE_PAD_MIDDLE) + " |";

      if (i === 0 && annotations[logEntry.data[0]]) {
        line += chunkStr + " " + annotations[logEntry.data[0]];
      } else if (i > 0) {
        line += " ".repeat(5) + "| " + chunkStr + "\n";
      } else {
        line += chunkStr + '\n';
      }
    }

    console.log(' ' + line.trim());
  }

}

exports = NfcLogr;