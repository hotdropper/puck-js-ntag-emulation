export default class TagGen {
    static wipeData(data) {
        data.set([0x04,0x25,0x70,0xD9,0x6A,0x4B,0x68,0x81], 0);
        data.set([0xC8,0x48,0x00,0x00,0xE1,0x10,0x3E,0x00], 8);
        data.set([0x03,0x00,0xFE,0x00,0x00,0x00,0x00,0x00], 16);
        for (let i = 24; i < 520; i = i + 8) {
            data.set([0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00], i);
        }
        data.set([0x00,0x00,0x00,0xBD,0x04,0x00,0x00,0xFF], 520);
        data.set([0x00,0x05,0x00,0x00,0xFF,0xFF,0xFF,0xFF], 528);
        data.set([0x00,0x00,0x00,0x00,0xFA,0x93,0xAA,0xE0], 536);
        data.set([0x1D,0xFF,0x87,0xEF,0x82,0x5B,0x27,0x57], 544);
        data.set([0x2A,0x02,0x21,0x8C,0xE8,0x54,0xD3,0x0B], 552);
        data.set([0x9F,0x91,0xAF,0x17,0x05,0x5A,0xF2,0x3F], 560);
        data.set([0x50,0x5A,0xE2,0x30,0x00,0x04,0x04,0x02], 568);
        data.set([0x01,0x00,0x11,0x03], 576);
        data.set([0x01,0x00,0x00,0x00], 580);
    }

    /**
     *
     * @returns {Uint8Array}
     */
    static generateData() {
        const newTagData = new Uint8Array(584);
        this.wipeData(newTagData);
        return newTagData;
    }
}