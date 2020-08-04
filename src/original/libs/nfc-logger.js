export default class NFCLogger {
    static attach(NRF) {
        NFCLogger.tracking = false;
        NFCLogger.monitorInterval = null;
        NFCLogger.dispatcherRunning = false;
        NFCLogger.count = 0;
        NFCLogger.lastCount = 0;
        NFCLogger.log = [];
        NFCLogger.recentlyCommunicated = false;

        NFCLogger.oldNfcSend = NRF.nfcSend;

        // this might be kinda confusing, but best practice is:
        // call attach() AFTER you have registered your primary handler
        // that way your request/response gets priority, and logging
        // comes afterwards. Unfortunately, this ALSO means that the logger
        // ends up getting your /response/ before it gets the /transmission/
        // so we store the response and then add it after the received data
        // in our NFCrx handler.
        let response = null;
        NRF.nfcSend = (data) => {
            NFCLogger.oldNfcSend.call(NRF, data);
            this.recentlyCommunicated = true;
            response = {type: 'tx', data };
        }

        NRF.on('NFCrx', (rx) => {
            this.recentlyCommunicated = true;
            this.log.push({type: 'rx', data: rx });
            this.log.push(response);
            response = null;
            this.count++;
        });
    }

    static stop() {
        this.tracking = false;
        clearInterval(this.monitorInterval);
        this.monitorInterval = null;
    }

    static start(timeout) {
        if (this.monitorInterval) {
            return;
        }

        this.tracking = true;
        this.monitorInterval = setInterval(() => { this._monitor(); }, timeout || 5000);
    }

    static _monitor() {
        if (this.dispatcherRunning === true || this.tracking === false || this.count === this.lastCount) {
            return;
        }

        if (this.recentlyCommunicated) {
            this.recentlyCommunicated = false;
            return;
        }

        this.dispatcherRunning = true;

        this.log.forEach(log => {
            console.log(log);
        });

        this.log = [];

        this.lastCount = this.count;

        this.dispatcherRunning = false;
    }
}