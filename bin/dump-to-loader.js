#!/usr/bin/env node
const path = require('path');
const cli = require('cli');
const tools = require(__dirname + '/../lib/tools');

function appendByteStringToArray(bytes, str, pos) {
    for (let i = 0; i < str.length; i += 2) {
        bytes[pos] = '0x' + str.substr(i, 2);
        pos++;
    }

    return pos;
}

cli.main((args, opts) => {
    if (args.length < 1 || args[0].toLowerCase().endsWith(".json") === false) {
        cli.error("Must pass a JSON file to process.");
        return 1;
    }

    const file = require(path.resolve(args[0]));
    // console.log(JSON.stringify(file, null, 2));
    const bytes = [];
    let pos = 0;
    Object.values(file.blocks).forEach(block => {
        pos = appendByteStringToArray(bytes, block, pos);
    });
    pos = appendByteStringToArray(bytes, file.Card.Signature, pos);
    appendByteStringToArray(bytes, file.Card.Version, pos);
    let outStr = 'var newTagData = new TagData();\n';
    for (let i = 0; i < bytes.length; i = i + 8) {
        const outBytes = bytes.slice(i, i+8);
        outStr += 'newTagData.buffer.set([' + outBytes.join(',') + '], ' + i + ");\n";
    }
    console.log(outStr);
    console.log(`

Debugger.enable();
NFCLogger.start();
tag.setData(newTagData);


`)
});