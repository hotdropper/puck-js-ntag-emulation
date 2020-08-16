/**
 * @typedef {Function} getTime
 * @returns {number}
 */

/**
 * @typedef {Object} LogEntry
 * @property {number} time
 * @property {string} type
 * @property {Uint8Array} data
 */

/**
 * @typedef {EventEmitter} NRF
 */

/**
 * @event NFC#NFCrx
 * @type {Uint8Array}
 */

/**
 * @event NFCrx
 * @
 * @type {number}
 */

const TABLE_PAD_START = 12;
const MAX_ELEMENTS_PER_ROW = 16;
const TABLE_PAD_MIDDLE = (MAX_ELEMENTS_PER_ROW * 3) + 2;
const TABLE_PAD_END = 15;

const annotations = {};

import './libs/polyfills';

export default class NFCLogger {
    static attach(NRF) {
        NFCLogger.tracking = false;
        NFCLogger.monitorInterval = null;
        NFCLogger.dispatcherRunning = false;
        NFCLogger.count = 0;
        NFCLogger.lastCount = 0;

        /** @var {LogEntry[]} */
        NFCLogger.log = [];

        NFCLogger.recentlyCommunicated = false;

        NFCLogger.oldNfcSend = NRF.nfcSend;

        // this might be kinda confusing, but best practice is:
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
        NRF.nfcSend = (data) => {
            NFCLogger.oldNfcSend.call(NRF, data);
            NFCLogger.recentlyCommunicated = true;
            NFCLogger.heldResponses.push({type: 'tx', data });
        }

        NRF.on('NFCrx',(rx) => NFCLogger._receive(rx));
    }

    /**
     *
     * @param {Uint8Array} rx
     * @listens NRF~event:NFCrx
     * @private
     */
    static _receive(rx) {
        this.recentlyCommunicated = true;
        this.log.push({type: 'rx', data: rx });
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
        if (this.monitorInterval) {
            return;
        }

        this.tracking = true;
        this.monitorInterval = setInterval(() => { this._monitor(); }, timeout || 5000);
    }

    static _monitor() {
        if (this.dispatcherRunning === true || this.tracking === false || this.count === this.lastCount) {
            return;
        }

        if (this.recentlyCommunicated) {
            this.recentlyCommunicated = false;
            return;
        }

        this.dispatcherRunning = true;

        this._printLogHeading();

        this.log.forEach(log => {
            this._printLogEntry(log);
        });

        this.log = [];

        this.lastCount = this.count;

        this.dispatcherRunning = false;
    }

    static _printLogHeading() {
        // let line = "Time |".padStart(TABLE_PAD_START, " ");
        let line = " Src |";
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
        if (! logEntry.data) {
            logEntry.data = [0x0A];
        }
        // let line = Math.round(logEntry.time).toString().padEnd(1, " ").padStart(TABLE_PAD_START);
        let line = " " + (logEntry.type === 'rx' ? 'Rdr' : 'Tag') + ' | ';
        for (let i = 0; i < logEntry.data.length; i += MAX_ELEMENTS_PER_ROW) {
            let chunk = [];
            if (logEntry.data instanceof Uint8Array) {
                chunk = new Uint8Array(logEntry.data.buffer, i, MAX_ELEMENTS_PER_ROW);
            } else if (logEntry.data instanceof Array) {
                chunk = logEntry.data.slice(i, MAX_ELEMENTS_PER_ROW);
            } else {
                chunk = [logEntry.data.toString()];
            }
            const chunkStr = (" " + chunk.map(c => parseInt(c).toString(16)).join(' ') + " ").replace(/ ([0-9a-zA-Z]) /g, '0$1').padEnd(TABLE_PAD_MIDDLE) + " |";
            if (i === 0 && annotations[logEntry.data[0]]) {
                line += chunkStr + " " + annotations[logEntry.data[0]]; + "\n"
            } else if (i > 0) {
                line += " ".repeat(5) + "| " + chunkStr + "\n";
            } else {
                line += chunkStr + '\n';
            }
        }
        console.log(' ' + line.trim());
    }
}