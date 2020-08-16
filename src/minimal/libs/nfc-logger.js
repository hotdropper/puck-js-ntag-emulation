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

import './polyfills';
import IdleDetector from "./idle-detector";'./idle-detector'

const TABLE_PAD_START = 12;
const MAX_ELEMENTS_PER_ROW = 16;
const TABLE_PAD_MIDDLE = (MAX_ELEMENTS_PER_ROW * 3) + 2;
const TABLE_PAD_END = 15;

const annotations = {
    rx: {
        0xA2: (data) => 'WRITE(' + data[1].toString('16').padStart(2, '0') + ')',
        0xA0: (data) => 'COMP_WRITE(' + data[1].toString('16').padStart(2, '0') + ')',
        0x1B: () => 'PWD_AUTH',
        0x30: (data) => 'READ(' + data[1].toString('16').padStart(2, '0') + ')',
        0x3C: () => 'READ_SIG',
        0x60: () => 'GET_VERSION',
        0x39: (data) => 'READ_CNT(' + data[1].toString('16').padStart(2, '0') + ')',
        0x3A: (data) => 'FAST_READ(' + data[1].toString('16').padStart(2, '0') + ' => ' + data[2].toString('16').padStart(2, '0') + ')'
    },
    tx: {
        0x00: (data) => data.length === 0 ? 'NAK_INVALID_ARG' : null,
        0x01: (data) => data.length === 0 ? 'NAK_CRC' : null,
        0x04: (data) => data.length === 0 ? 'NAK_AUTH_LOCKOUT' : null,
        0x05: (data) => data.length === 0 ? 'NAK_EEPROM_ERROR' : null,
        0x0A: (data) => data.length === 0 ? 'ACK' : null,
    },
};

export default class NFCLogger {
    static attach() {
        if (NFCLogger.attached === true) {
            return;
        }

        NFCLogger.attached = true;
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
            // setTimeout(() => console.log('Sending', data), 250);
            NFCLogger.originalNfcSend.call(NRF, data);
            if (NFCLogger.tracking === false) {
                return;
            }

            if (data instanceof Uint8Array) {
                NFCLogger.heldResponses.push({type: 'tx', data: data });
            } else if (data instanceof Number) {
                NFCLogger.heldResponses.push({type: 'tx', data: new Uint8Array([data]) });
            } else {
                NFCLogger.heldResponses.push({type: 'tx', data: new Uint8Array(0) });
            }
            
            NFCLogger.idleDetector.tick();
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
        if (NFCLogger.tracking === false) {
            return;
        }
        NFCLogger.log.push({type: 'rx', data: new Uint8Array(rx) });
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

        NFCLogger.log.forEach(log => {
            NFCLogger._printLogEntry(log);
        });

        NFCLogger.log = [];

        NFCLogger.lastCount = NFCLogger.count;
    }

    static _printLogHeading() {
        // let line = "Time |".padStart(TABLE_PAD_START, " ");
        let line = " Src | ";
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
        if (! logEntry.data) {
            logEntry.data = new Uint8Array([]);
        }
        // let line = Math.round(logEntry.time).toString().padEnd(1, " ").padStart(TABLE_PAD_START);
        for (let i = 0; i < logEntry.data.length; i += MAX_ELEMENTS_PER_ROW) {
            let line = " " + ((i === 0) ? (logEntry.type === 'rx' ? 'Rdr' : 'Tag') : '   ') + ' | ';
            let chunk = [];
            let end = i +  MAX_ELEMENTS_PER_ROW;
            if (end > logEntry.data.length) {
                end = logEntry.data.length - i;
            } else {
                end = MAX_ELEMENTS_PER_ROW;
            }
            // console.log({ i: i, end: end });
            chunk = new Uint8Array(logEntry.data.buffer, logEntry.data.byteOffset + i, end);
            // chunk.forEach(c => console.log(JSON.stringify(c)));
            let chunkStr = ' ';
            chunk.forEach(c => {
                chunkStr += c.toString(16).toUpperCase().padStart(2, '0') + ' ';
            });
            chunkStr = chunkStr.padEnd(TABLE_PAD_MIDDLE) + " |";
            const annotation = annotations[logEntry.type][logEntry.data[0]] ? annotations[logEntry.type][logEntry.data[0]](logEntry.data) : null;
            if (i === 0 && annotation) {
                line += chunkStr + " " + annotation
            } else {
                line += chunkStr;
            }
            console.log(line);
        }
    }
}

NFCLogger.originalNfcSend = NRF.nfcSend;

NFCLogger.idleDetector = new IdleDetector('log watch', 5000, () => {
    NFCLogger._monitor();
});

NFCLogger.tracking = false;
/** @var {LogEntry[]} */
NFCLogger.log = [];
/** @var {LogEntry[]} */
NFCLogger.heldResponses = [];
