export default class IdleDetector {
    constructor(name, whenIdleFor, doAction) {
        this.name = name;
        this.interval = whenIdleFor / 2;
        this.doAction = doAction;
        this.timeoutRef = null;
        this.ticks = 0;
        this.lastTick = null;
        this.actionTick = 0;
        this.enabled = false;
    }

    enable(interval) {
        if (interval) {
            this.interval = interval;
        }
        this.enabled = true;
        this.registerTimeout();
    }

    disable() {
        this.enabled = false;
        if (this.timeoutRef) {
            clearTimeout(this.timeoutRef);
            this.timeoutRef = null;
        }
    }

    tick() {
        if (this.enabled) {
            this.ticks++;
        }
    }

    monitor() {
        // console.log('monitor check', this.name);
        if (this.lastTick !== this.ticks) {
            this.lastTick = this.ticks;
            return this.registerTimeout();
        }

        if (this.ticks !== this.actionTick) {
            this.actionTick = this.ticks;
            this.doAction();
        }

        return this.registerTimeout();
    }

    registerTimeout() {
        if (this.timeoutRef) {
            return;
        }
        this.timeoutRef = setTimeout(() => {
            this.timeoutRef = null;
            this.monitor();
        }, this.interval);
    }
}