const leds = [
    { led: LED1, state: false },
    { led: LED2, state: false },
    { led: LED3, state: false },
];

for (let i = 0; i < leds.length; i++) {
    leds[i].led.write(false);
}

function buildToggler(LED, state) {
    return function() {
        state = !state;
        LED.write(state);
    };
}

function run(LED, state, interval) {
    return function() {
        const toggler = buildToggler(LED, state);
        setInterval(toggler, interval);
    };
}

function initialize(LED, state, interval, wait) {
    return function() {
        const runFunc = run(LED, state, interval);
        setTimeout(runFunc, wait);
    };
}

for (let i = 0; i < leds.length; i++) {
    const led = leds[i];
    const initialTimeout = i * 500;
    const timeout = 500 * 2;
    const initializer = initialize(led.led, led.state, timeout, initialTimeout);
    initializer();
}

var btnHoldCount = 0;
function readButton() {
    //console.log(BTN1.read());
    if (BTN1.read()) {
        btnHoldCount++;
    } else {
        if (btnHoldCount > 4) {
            E.reboot();
        }

        btnHoldCount = 0;
    }
}

setInterval(readButton, 1000);

