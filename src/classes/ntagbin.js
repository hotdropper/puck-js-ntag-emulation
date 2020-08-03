const storage = require("Storage");
const debug = require('./debug.js');
class NTagBin {
    constructor(filename) {
        this.filename = filename;
        const buffer = storage.readArrayBuffer(filename);

        if (buffer) {
            this.data = new Uint8Array(buffer);
        } else {
            this.data = new Uint8Array(572);
        }
    }

    save() {
        this.fixBadData();
        storage.write(this.filename, this.data);
    };
    
    fixBadData() {
        const bcc0 = this.data[0] ^ this.data[1] ^ this.data[2] ^ 0x88;
        const bcc1 = this.data[4] ^ this.data[5] ^ this.data[6] ^ this.data[7];

        debug(() => {
            let uidBlock = "";
            for (let i = 0; i < 9; i++) {
                uidBlock += this.data[i].toString(16)+ " ";
            }
            console.log(uidBlock);
            console.log(bcc0.toString(16) + " " + bcc1.toString(16));
        });

        if (this.data[3] !== bcc0 || this.data[8] !== bcc1) {
            this.data[3] = bcc0;
            this.data[8] = bcc1;

            console.log("Fixed bad bcc");

            return true;
        }

        return false;
    }
}

module.exports = NTagBin;
