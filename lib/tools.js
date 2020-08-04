const util = require('util');
const fs = require('fs');

const cmd_empty = 'A2%s00000000';
const cmd_cfg1 = 'A2%s000000FF';
const cmd_cfg2 = 'A2%s00050000';

let cacheWrites = false;
let writeBuffer = [];

function setWriteMode(cache) {
    cacheWrites = (cache === true);
}

function clearCache() {
    const oldBuff = writeBuffer;
    writeBuffer = [];
    return oldBuff;
}

function toHex(dec) {
    //console.log('to hex: ', dec, dec.toString(16));
    return dec.toString(16).padStart(2, '0');
}

function bcc(b1, b2, b3, b4) {
    return (((b1 ^ b2) ^ b3) ^ b4);
}

function printCmd(str) {
    let out = '40 01 ';
    for (let i = 0; i < str.length; i+=2) {
        out += str.substr(i, 2) + ' ';
    }

    if (cacheWrites) {
        writeBuffer.push(out.trim());
        return;
    }

    console.log(out.trim());
}

function wipe() {
    for (let b = 3; b <= 0xFB; b++) {
        let tmpl = cmd_empty;
        if (b === 0x29 || b === 0x83 || b === 0xe3) {
            tmpl = cmd_cfg1;
        } else if (b == 0x2a || b == 0x84 || b == 0xe4) {
            tmpl = cmd_cfg2;
        }
        const cmd = util.format(tmpl, toHex(b));
        printCmd(cmd);
    }
}

function setUid(uid) {
    const bytes = [null];
    for (let i = 0; i < uid.length; i+=2) {
        bytes.push(parseInt(uid.substr(i, 2), 16));
    }

    const bcc1 = bcc(bytes[1], bytes[2], bytes[3], 0x88);
    const bcc2 = bcc(bytes[4], bytes[5], bytes[6], bytes[7]);

    const block0 = toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + toHex(bcc1);
    const block1 = toHex(bytes[4]) + toHex(bytes[5]) + toHex(bytes[6]) + toHex(bytes[7]);
    const block2 = toHex(bcc2) + '480000';
    printCmd('A200' + block0);
    printCmd('A201' + block1);
    printCmd('A202' + block2);
}


function setVersion(version) {
    const b1 = version.substr(0, 8);
    const b2 = version.substr(8);
    printCmd('a2fa' + b1);
    printCmd('a2fb' + b2);
}

function setSignature(sig) {
    const tmpl = 'a2f';
    let j = 2;
    for (let i = 0; i < sig.length; i+=8) {
        const chunk = sig.substr(i, 8);
        printCmd(tmpl + j + chunk);
        j++;
    }
}

function setPassword(pwd) {
    printCmd('A2F0' + pwd);
}

function setPack(pack) {
    printCmd('A2F1' + pack);
}

function binFileTo4ByteStrings(file) {
    const buff = fs.readFileSync(file);

    const bytes = [];

    for (let i = 0; i < buff.length; i++) {
        bytes.push(buff.readUInt8(i));
    }

    const lines = [];

    for (let i = 0; i < bytes.length; i += 4) {
        let line = '';
        for (let j = 0; j < 4; j++) {
            line += toHex(bytes[i + j]);
        }
        lines.push(line);
    }

    return lines;
}

module.exports = {
    toHex,
    bcc,
    printCmd,
    wipe,
    setUid,
    setVersion,
    setSignature,
    binFileTo4ByteStrings,
    setPassword,
    setPack,
    setWriteMode,
    clearCache,
};
