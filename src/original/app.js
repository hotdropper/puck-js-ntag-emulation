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

import Debugger from './libs/debugger';
import TagGen from "./libs/tag-gen";
const NFCLogger = require('NfcLogger');
const Storage = require("Storage");

const staticResponses = {
    nak: {
        invalid_argument: 0,
        invalid_crc: 1,
        auth_lockout: 4,
        eeprom_error: 5,
    },
    atqa: new Uint8Array([0x00, 0x44]),
    sak: new Uint8Array(0x00),
    ack: new Uint8Array(0x0A),
    backdoorOpened: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
    backdoorClosed: new Uint8Array([0x04, 0x03, 0x02, 0x01]),
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
    start: function() {
        NRF.nfcStart(new Uint8Array([this._data[0], this._data[1], this._data[2], this._data[4], this._data[5], this._data[6], this._data[7]]));
    },
    stop: function() {
        NRF.nfcStop();
    },
    activate: function() {
        for (let i = 0; i<this.led.length; i++) {
            digitalWrite(this.led[i], 1);
        }
    },
    deactivate: function() {
        for (let i = 0; i<this.led.length; i++) {
            digitalWrite(this.led[i], 0);
        }

        this.authenticated = false;
        this.backdoor = false;

        if (this.tagWritten === true) {
            if (this.fileData) {
                this.fileData.save();
            }
            //console.log("Saving tag to flash");
            //require("Storage").write(filename, this._data);
            this.tagWritten = false;
        }
    },
    receive: function(rx) {
        if (rx && this._callbacks[rx[0]]) {
            this._callbacks[rx[0]](rx, this);
        } else {
            NRF.nfcSend(staticResponses.nak.invalid_argument);
        }
    },
    _initCard: function() {
        const pwStart = 0x85 * 4;
        this._info.password = new Uint8Array(this._data.buffer, pwStart - 1, 5);
        this._info.password[0] = 0x1b;

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

        Debugger.debug(() => {
            console.log('password', this._info.password);
            console.log('pack', this._responses.pack);
            console.log('signature', this._responses.signature);
            console.log('version', this._responses.version);
        });
        this._fixUid();
        this.lockedPages = this._getLockedPages();
    },
    _fixUid: function() {
        const bcc0 = this._data[0] ^ this._data[1] ^ this._data[2] ^ 0x88;
        const bcc1 = this._data[4] ^ this._data[5] ^ this._data[6] ^ this._data[7];

        Debugger.debug(() => {
            let uidBlock = "";
            for (let i = 0; i < 9; i++) {
                uidBlock += this._data[i].toString(16)+ " ";
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
    _getLockedPages: function() {
        const locked = [0, 1];

        // Static Lock Bytes
        for (let bit = 0; bit < 8; bit++) {
            if (this._data[11] & (1 << bit)) {
                locked.push(bit + 8);
            }

            if (this._data[10] & (1 << bit)) {
                switch (bit) {
                    case 0: //BL-CC
                    case 1: //BL-9-4
                    case 2: //BL-15-10
                    case 3: //L-CC
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

        const pages = {};
        locked.forEach(page => {
            pages[page] = true;
        })

        return pages;
    },
    _readPage: function(page) {
        if (this.backdoor === false && (page < 0 || page > 134)) {
            return staticResponses.nak.invalid_argument;
        }

        if (!this.backdoor && (page === 133 || page === 134)) {
            return new Uint8Array(4);
        }

        // reads on the MFU cards send back 16 bytes...
        // this also fixes the signature validation issue I was seeing.
        // I suspect the data beyond page 134 is 'undefined' and we don't have to worry about it.
        // In practice, it looks like the data returned when you ask for page 134 is:
        // [4 bytes page 134] + [first 12 bytes of tag]
        //send response
        return new Uint8Array(this._data.buffer, page * 4, 16);
    },
    _info: {
        password: [0x1b, 0x00, 0x00, 0x00, 0x00],
    },
    _callbacks: {
        0x30: function read(rx, self) {
            NRF.nfcSend(self._readPage(rx[1]));
        },
        0xa2: function write(rx, self) {
            if (!this.backdoor && (rx[1] > 134 || self.lockedPages[rx[1]])) {
                NRF.nfcSend(staticResponses.nak.invalid_argument);
                Debugger.debug(() => {
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

                if (rx[1] === 130) {
                    // TODO: Dynamic lock bits
                }
            }

            //calculate block index
            const idx = rx[1] * 4;

            //store data if it fits into memory
            if (idx > self._data.length) {
                NRF.nfcSend(staticResponses.nak.invalid_argument);
            } else {
                const view = new Uint8Array(rx, 2, 4);
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
                Debugger.debug(() => {
                    console.log("Invalid fast read command");
                });
                return;
            }

            if (rx[1] === 133 && rx[2] === 134) {
                if (! self.backdoor) {
                    NRF.nfcSend(staticResponses.backdoorOpened);
                    self.backdoor = true;
                } else {
                    if (self.tagData) {
                        NRF.nfcSend(staticResponses.backdoorClosed);
                        self.backdoor = false;
                        setTimeout(() => {
                            self.tagData.save();
                            self.stop()
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
            console.log('Authenticated.')
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
        },
    },
    setData: function(data) {
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
            const err = new Error("Invalid argument");
            err.Data = { data };
        }

        // init card and fix bcc0 and bcc1 if needed
        this._initCard();

        //re-start
        this.start();
    },
    getData: function() { return this._data; }
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
        const fileBuff = Storage.readArrayBuffer(filename);

        if (fileBuff) {
            const minLen = fileBuff.length > this.buffer.length ? this.buffer.length : fileBuff.length;
            for (let buffPos = 0; buffPos < minLen; buffPos++) {
                this.buffer[buffPos] = fileBuff[buffPos];
            }
        }
    }
}

TagData.prototype.save = function() {
    // no op
};

TagDataFile.prototype.save = function() {
    // Storage.write(this.filename, this.buffer);
};

const tags = (function() {
    const leds = [
        { led: [LED1] },
        // { led: [LED1, LED2] },
        // { led: [LED2] },
        // { led: [LED2, LED3] },
        { led: [LED3] }
    ];

    const data = [];

    for (let i = 0; i < leds.length; i++) {
        const filename = "tag" + i + ".bin";
        data[i] = new TagDataFile(leds[i].led, filename);
    }

    return data;
})();


let currentTag = 0;

let tag = new NFCTag(tags[currentTag]);

NRF.on('NFCon', () => {
    tag.activate();
});

NRF.on('NFCoff', () => {
    setTimeout(() => tag.deactivate(), 0);
});

NRF.on('NFCrx', (rx) => {
    tag.receive(rx);
});

// NFCLogger.attach(NRF);

setWatch(function() {
    tag.stop();

    // tags[currentTag].save();

    currentTag++;

    if (currentTag > tags.length - 1) {
        currentTag = 0;
    }

    tag.led = tags[currentTag].led;

    LED1.write(0);
    LED2.write(0);
    LED3.write(0);

    for (let i = 0; i<tag.led.length; i++) {
        digitalWrite(tag.led[i], 1);
    }

    tag = new NFCTag(tags[currentTag]);

    setTimeout(() => {
        for (let i = 0; i<tag.led.length; i++) {
            digitalWrite(tag.led[i], 0);
        }

    }, 200);
}, BTN, { repeat: true, edge:"rising", debounce:50 });

//process.on('uncaughtException', function(e) { console.log(e); });