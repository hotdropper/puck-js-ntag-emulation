export default class Debugger {
    static debug(fn) {
        if (this.isEnabled()) {
            fn();
        }
    }

    static isEnabled() {
        return this.enabled === true;
    }

    static enable() {
        this.enabled = true;
    }

    static disable() {
        this.enabled = false;
    }

    /**
     *
     * @param {NFCTag} tag
     * @param {number} bytesPerLine
     */
    static exportTag(tag, bytesPerLine) {
        bytesPerLine = bytesPerLine || 16
        console.log('tag._data = new Uint8Array(584);');
        console.log('var s = (i, d) => tag._data.set(d, i * 4);');
        for (let i = 0; i < tag._data.length; i += bytesPerLine) {
            const bytes = tag._data.slice(i, i + bytesPerLine);
            const line = bytes.map(b => b.toString(16).padStart(2, '0')).join(', 0x');
            console.log('s(' + i / 4 + ', [0x' + line + ']);');
        }
        console.log('delete s;');
        console.log('tag.restart();');
    }
}


