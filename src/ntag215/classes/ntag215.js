const NTagBin = require('./ntagbin');
const ByteTools = require('./byte-tools');

// much of this is pulled from https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf

const staticResponses = {
    nak: {
        argument: new Uint8Array([0x00]),
        crc: new Uint8Array([0x01]),
        auth: new Uint8Array([0x04]),
        eeprom: new Uint8Array([0x04]),
    },
    atqa: new Uint8Array([0x00, 0x44]),
    sak: new Uint8Array([0x00]),
    ack: new Uint8Array([0x0A]),
    backdoorOpened: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
    backdoorClosed: new Uint8Array([0x04, 0x03, 0x02, 0x01]),
};

const page = (pos, offset) => (pos * 4) + (offset || 0);

const WRITE_PROTECTION = {
    CONSTANT: 'constant',
    LOCKABLE: 'lockable',
    READ_ONLY: 'read-only',
    DYNAMIC: 'dynamic',
};

const dynamicData = {
    pwd: {
        start: page(0x85),
        length: 4,
        protection: WRITE_PROTECTION.LOCKABLE,
    },
    pack: {
        start: page(0x86),
        length: 2,
        protection: WRITE_PROTECTION.LOCKABLE,
    },
    serial: {
        start: page(0x00),
        length: 9,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    lock_bytes: {
        start: page(0x02, 2),
        length: 2,
        protection: WRITE_PROTECTION.LOCKABLE,
    },
    dynamic_lock_bytes: {
        start: page(0x820),
        length: 3,
        protection: WRITE_PROTECTION.LOCKABLE,
    },
    capability_container: {
        start: page(0x03),
        length: 4,
        protection: WRITE_PROTECTION.LOCKABLE,
    },
    cfg0: {
        start: page(0x83),
        length: 4,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    cfg1: {
        start: page(0x84),
        length: 4,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    internal: {
        start: page(0x02, 1),
        length: 1,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    rfui1: {
        start: page(0x82, 3),
        length: 1,
        protection: WRITE_PROTECTION.CONSTANT,
    },
    rfui2: {
        start: page(0x86, 2),
        length: 2,
        protection: WRITE_PROTECTION.CONSTANT,
    }
};

const lockBytePages = {
    0: {
        128: page(0x07),
        64: page(0x06),
        32: page(0x05),
        16: page(0x04),
        8: page(0x03),
    },
    1: {
        128: page(0x0f),
        64: page(0x0e),
        32: page(0x0d),
        16: page(0x0c),
        8: page(0x0b),
        4: page(0x0a),
        2: page(0x09),
        1: page(0x08),
    }
};

const lockByteBits = {
    1: { 0: 8 },
    2: { 0: 16 + 32 + 64 + 128, 1: 1 + 2 },
    4: { 1: 4 + 8 + 16 + 32 + 64 + 128 }
};

const dynamicLockBytes = {
    0: {
        128: { start: page(128), end: page(129) },
        64: { start: page(112), end: page(127) },
        32: { start: page(96), end: page(111) },
        16: { start: page(80), end: page(95) },
        8: { start: page(64), end: page(79) },
        4: { start: page(48), end: page(63) },
        2: { start: page(32), end: page(47) },
        1: { start: page(16), end: page(31) },
    },
};
const dynamicLockByteBits = {
    3: {
        8: 128 + 64,
        4: 32 + 16,
        2: 8 + 4,
        1: 2 + 1,
    }
};

const commands = {
    get_version: 0x60,
    read: 0x30,
    fast_read: 0x3a,
    write: 0xa2,
    comp_write: 0xa0,
    read_cnt: 0x39,
    pwd_auth: 0x1b,
    read_sig: 0x3c,
};

class Ntag215 {
    /**
     *
     * @param {string} id
     * @param {NTagBin} bin
     */
    constructor(id, bin) {
        this.id = id;
        this.bin = bin;
        this.data = bin.data;
        this.old_data = [];
        this.pwd = [];
        this.pack = [];
        this.serial = [];
        this.lock_bytes = [];
        this.dynamic_lock_bytes = [];
        this.capability_container = [];
        this.cfg0 = [];
        this.cfg1 = [];
        this.internal = [];
        this.rfui1 = [];
        this.rfui2 = [];
    }

    activate() {
        this.bin.fixBadData();
        this.old_data = new Uint8Array(this.data, 0, this.data.length);
        this.authenticated = false;
        this.backdoored = false;
        this.primeData();
    }

    deactivate() {
        if (! this.backdoored) {
            this.restoreWriteProtectedAreas();
        }

        this.authenticated = false;
        this.backdoored = false;
        this.bin.save();
    }

    restoreWriteProtectedAreas() {
        dynamicData.forEach((val, key) => {
            if (val.protection === WRITE_PROTECTION.CONSTANT) {
                ByteTools.copy(this[key], 0, this.data, val.start, val.length);
            }
        });

        const lockByteStart = dynamicData.lock_bytes.start;
        const newLockBytes = new Uint8Array(this.data, lockByteStart, dynamicData.lock_bytes.length);
        lockByteBits.forEach((lockedBits, lockBit) => {
            if (this.lock_bytes[0] & lockBit) {

            }
        });

        lockBytePages.forEach((byteData, byteNum) => {
            byteData.forEach((page, bit) => {
                if (this.lock_bytes[byteNum] & bit) {
                    ByteTools.copy(this.old_data, page, this.data, page, 4);
                }
            });
        });
        lockByteBits.forEach((byteData, lockBit) => {
            if (this.lock_bytes[0] & lockBit) {
                byteData.forEach((lockedBits, byteNum) => {
                    const currentLockedBits = this.lock_bytes[byteNum] & lockedBits;
                    const unlockedBits = this.lock_bytes[byteNum] ^ lockedBits;
                    this.data[lockByteStart + byteNum] = (this.data[lockByteStart + byteNum] | unlockedBits) + currentLockedBits;
                });
            }
        });
        // handle dynamic lock bytes pretty much like the regular lock bytes... tbd...
    }

    primeData() {
        this.uid = new Uint8Array(7);
        ByteTools.copy(this.data, 0, this.uid, 0, 3);
        ByteTools.copy(this.data, 4, this.uid, 3, 4);
        this.version = new Uint8Array([0x00, 0x04, 0x04, 0x02, 0x01, 0x00, 0x11, 0x03]);

        dynamicData.forEach((val, key) => {
            this[key] = new Uint8Array(this.data, val.start, val.length);
        });
    }
}

module.exports = Ntag215;
