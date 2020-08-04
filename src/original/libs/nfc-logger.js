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
        NRF.nfcSend = (data) => {
            NFCLogger.oldNfcSend.call(NRF, data);
            this.recentlyCommunicated = true;
            this.log.push({type: 'tx', data });
        }

        NRF.on('NFCrx', (rx) => {
            this.recentlyCommunicated = true;
            this.log.push({type: 'rx', data: rx });
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