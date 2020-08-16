# Use

### Init

```
nvm use
npm install
npm install gulp -g
```

### Load a file onto the puck
`gulp --target <target>`

### Generate the file that will be deployed
`gulp --target <target> rollup`

### Open console
`npm start`

### Stability

By default, NFC seems to be pretty low priority on the Puck.

If you install my NFC friendly firmware from 
[RELEASE_2V06-NFC from my fork of Espruino](https://github.com/hotdropper/Espruino/releases/tag/RELEASE_2V06-NFC)
 you should see a lot more stability out of the behavior. 


## Minimum Example (target: minimum)

This version works to emulate the
[Lab401 Magic NTag 21x](https://lab401.com/products/ntag-compatible-21x)

It doesn't bother with the pretence of implementing write protection.

Most read/write behavior has been confirmed against actual NTag 215s and Magic NTag 21xs.

It currently uses a 584 byte tag. I suspect as I understand the [NTag 21x spec](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf) better, it will grow to use the same 596 byte tag that [Proxmark3](https://github.com/Proxmark/proxmark3) exports.

Implements all of the main commands in the spec. `READ_CNT` is likely not correct, however.

In addition, there are the read/write pages from the Magic NTag 21x interface:

| Type     | Page | Purpose |
|----------|------|---------|
| Command  | 0x88 | resets the tag, reads in an updated UID |
| Address  | 0xF0 | Password (4 bytes) |
| Address  | 0xF1 | PACK (2 bytes)     |
| Address  | 0xF2-0xF9 | Signature (32 bytes) |
| Address  | 0xFA-0xFB | Version (8 bytes) |
| Address  | 0xFC | Mode on Magic NTag 21x, not implemented here, since we currently only handle NTag 215 emulation.     

### Behavior

When the data on the tag becomes "Dirty", the Blue LED will light up.

The **only** thing this will impact is that the UID you can read directly is NOT the UID that is advertised, if you have changed the UID during writes. All other write actions are incorporated immediately, as the internal `_page` Uint8Arrays all reference the `_data.buffer` as a source.

To make the tag pick up it's new UID, simply give it a *click* or send command `0x88`.

### Button Clicks

Max time between clicks for them to increment: 1 second

| Clicks | Action |
|--------|--------|
| 1 | Restarts the tag to pick up new UIDs |
| 3 | Reboots the Puck. If you haven't ran `save()` you will lose your current state. |

### Use cases confirmed

* It works with the proxmark3 `mfu_magic` script for setting properties.
* It works for being read as an amiibo with a properly written tag.
* It works as being written to as an amiibo with a properly written tag.

### Helpers while you experiment

#### `void TagGen.wipe(Uint8Array data)`

Resets the tag back to a 'Know Good' and clean state.

#### `Uint8Array TagGen.generate()`

Creates a new `Uint8Array`, runs `wipe`, and returns it.

#### `void TagGen.export(NFCTag tag, number bytesPerLine)`

Outputs a formatted dump of the tag to the console.
Dump is in JS format designed to be efficiently loaded back in to the Puck, and also easily diffable against other dumps to view changes.

You can see examples of this in the [ndef folder](ndef).
 
## Expected code layout

main file goes in: `src/<target>/app.js`

Additional files go in `src/<target>/<subdir>/<file.js>`

### How to include files

Use ES6 syntax to include local files:

`import Foo from './libs/foo.js';`

Use OldSchool syntax to include Puck modules:

`const Storage = require('Storage');`

## Build

`gulp --target <target> rollup`

puts a file in `dist/<target>/app.js`

## Upload

`gulp --target <target> upload`

uploads `dist/<target>/app.js` to your puck

## One-shot

`gulp --target <target>`

builds `dist/<target>/app.js` and uploads it.


