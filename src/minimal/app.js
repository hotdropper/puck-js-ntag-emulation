/* Copyright (c) 2020 Daniel Radtke. See the file LICENSE for copying permission. */
/* Copyright (c) 2018 Andreas Dröscher. See the file LICENSE for copying permission. */
/* Copyright (c) 2013 Gordon Williams, Pur3 Ltd

------------------------------------------------------------------------------

All sections of code within this repository are licensed under an MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// import NFCLogger from './libs/nfc-logger';
// import IdleDetector from './libs/idle-detector';
// import Debugger from './libs/debugger';
import TagGen from "./libs/tag-gen";

const staticResponses = {
    nak: {
        invalid_argument: 0,
        invalid_crc: 1,
        auth: 4,
        eeprom_error: 5,
    },
    atqa: new Uint8Array([0x00, 0x44]),
    sak: 0x00,
    ack: 0x0A,
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

let compatWriteAddr = null;
const compatWriteMsg = new Uint8Array(18);
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
        const resp = new Uint8Array(16);
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
        return new Uint8Array(self._data.buffer, rx[1] * 4, ((rx[2] - rx[1]) + 1) * 4);
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

const commands = {
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
    0x52: wupa,
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

        const pwStart = 0x85 * 4;
        this._info.password = new Uint8Array(this._data.buffer, pwStart, 4);

        const packStart = 0x86 * 4;
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
        for (let i = 0; i < 135; i++) {
            let len = 16;
            if (i > 0x81) {
                len -= (i - 0x81) * 4;
            }
            if (len < 4) {
                this._pages[i] = new Uint8Array(4);
            } else {
                this._pages[i] = new Uint8Array(this._data.buffer, i * 4, len);
            }
        }

        // this is modeled after how the Magic NTag 21x does things
        this._pages[0xF0] = new Uint8Array(this._data.buffer, pwStart, 4)
        this._pages[0xF1] = new Uint8Array(this._data.buffer, packStart, 2)
        // signature piece 1 of 8
        this._pages[0xF2] = new Uint8Array(this._data.buffer, 540, 4)
        this._pages[0xF3] = new Uint8Array(this._data.buffer, 544, 4)
        this._pages[0xF4] = new Uint8Array(this._data.buffer, 548, 4)
        this._pages[0xF5] = new Uint8Array(this._data.buffer, 552, 4)
        this._pages[0xF6] = new Uint8Array(this._data.buffer, 556, 4)
        this._pages[0xF7] = new Uint8Array(this._data.buffer, 560, 4)
        this._pages[0xF8] = new Uint8Array(this._data.buffer, 564, 4)
        this._pages[0xF9] = new Uint8Array(this._data.buffer, 568, 4)
        // version piece 1 of 2
        this._pages[0xFA] = new Uint8Array(this._data.buffer, 572, 4)
        // version piece 2 of 2
        this._pages[0xFB] = new Uint8Array(this._data.buffer, 576, 4)
        this._pages[0xFC] = new Uint8Array(this._data.buffer, 580, 4)

        // Debugger.debug(() => {
        //     console.log('password', this._info.password);
        //     console.log('pack', this._responses.pack);
        //     console.log('signature', this._responses.signature);
        //     console.log('version', this._responses.version);
        // });
    }

    _fixUid() {
        const bcc0 = this._data[0] ^ this._data[1] ^ this._data[2] ^ 0x88;
        const bcc1 = this._data[4] ^ this._data[5] ^ this._data[6] ^ this._data[7];

        // Debugger.debug(() => {
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

const tagData = TagGen.generate();
const tag = new NFCTag(LED1, tagData);

// const idleMonitor = new IdleDetector('card watch',10000, () => {
//     tag.restart();
// });
// idleMonitor.enable();

const firstErrors = [];
const lastErrors = [];
const oldNfcSend = NRF.nfcSend;
let lastNfcTx = null;
NRF.nfcSend = function(tx) {
    lastNfcTx = tx;
    return oldNfcSend(tx);
}

function processRx(rx) {
    try {
        if (compatWriteAddr) {
            NRF.nfcSend(commands[0xa0](tag, rx));
        } else if (rx && commands[rx[0]]) {
            NRF.nfcSend(commands[rx[0]](tag, rx));
        } else {
            NRF.nfcSend(staticResponses.nak.invalid_argument);
        }
    }
    catch (/** @var {Error} */e) {
        // NRF.nfcSend(staticResponses.nak.invalid_argument);
        if (firstErrors.length < 5) {
            firstErrors.push({ ex: e, rx, tx: lastNfcTx });
        } else {
            lastErrors.push({ ex: e, rx, tx: lastNfcTx });
            if (lastErrors.length > 5) {
                lastErrors.shift();
            }
        }
    }
    // idleMonitor.tick();
}

NRF.on('NFCrx', (rx) => { processRx(rx); });

tag.start();

import ClickWatcher from "./libs/button";
ClickWatcher(1000, {
    1: () => {
        tag.stop();
        LED2.write(1);

        tag._initCard();

        setTimeout(function () {
            tag.start();
            LED2.write(0);
        }, 200);
    },
    3: () => console.log('Rebooting...'),
})

function errors() {
    return [].concat(firstErrors).concat(lastErrors);
}

// console.log(NFCLogger.attach.toString());
// NFCLogger.attach(NRF);
// NFCLogger.stop();


//process.on('uncaughtException', function(e) { console.log(e); });