export default class Debugger {
    static debug(fn) {
        if (this.enabled) {
            fn();
        }
    }

    static enable() {
        this.enabled = true;
    }

    static disable() {
        this.enabled = false;
    }
}

Debugger.enabled = false;
