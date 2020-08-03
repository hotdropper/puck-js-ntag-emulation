const NTagBin = require('./classes/ntagbin.js');
const NTag215 = require('./classes/ntag215.js');

const leds = [
    { led: [LED1] },
    { led: [LED1, LED2] },
    { led: [LED2] },
    { led: [LED2, LED3] },
    { led: [LED3] }
];

const tagData = (function() {
    const data = [];

    for (let i = 0; i < leds.length; i++) {
        data[i] = new NTagBin("tag" + i + ".bin");
    }

    return data;
})();


let currentTag = 0;

let tag = new NTag215(currentTag, tagData[currentTag]);
tag.activate();

setWatch(function() {
    NRF.nfcStop();

    tag.deactivate();

    currentTag++;

    if (currentTag > tags.length - 1) {
        currentTag = 0;
    }

    tag = new Ntag215(currentTag, tagData[currentTag]);

    const led = leds[currentTag];

    LED1.write(0);
    LED2.write(0);
    LED3.write(0);

    for (var i = 0; i<led.length; i++) {
        digitalWrite(led[i], 1);
    }

    setTimeout(() => {
        tag.activate();

        for (var i = 0; i<led.length; i++) {
            digitalWrite(led[i], 0);
        }
    }, 200);
}, BTN, { repeat: true, edge:"rising", debounce:50 });
