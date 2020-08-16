export class LedDancer {
    /**
     *
     * @param {LED[]|LED} leds
     * @param {number} interval
     * @param {number} times
     * @param {Function} [onComplete]
     */
    static dance(leds, interval, times, onComplete) {
        if (leds instanceof Pin) {
            leds = [leds];
        }
        let state = 0;
        let count = 0;

        const progress = () => {
            state = Math.abs(state - 1);
            leds.forEach(pin => pin.write(state));
            if (state === 1) {
                count++;
            }

            if (count < times || state === 1) {
                setTimeout(progress, interval);
            } else if (onComplete) {
                onComplete();
            }
        }
        setTimeout(progress, interval);
    }
}

/**
 * @param {number} delayBetweenClicks
 * @param {Object<number, Function>} actions
 */
export default function wireUp(delayBetweenClicks, actions) {
    const leds = [LED1, LED2, LED3];

    E.on('init', () => {
        leds.forEach(p => p.write(0));
    });

    /**
     *
     * @param {number} rebootAtCount
     */
    function rebootPuck(rebootAtCount) {
        LedDancer.dance(leds, 1000, rebootAtCount, () => {
            leds.forEach(p => p.write(1));
            E.reboot()
        });
    }

    let lastClick = null;
    let clickTimeout = null;
    let buttonClicks = 0;
    actions = actions || {};
    if (actions[3]) {
        if (actions[3] instanceof Array) {
            actions[3].push(() => rebootPuck(3));
        } else {
            actions[3] = [actions[3], () => rebootPuck(3)];
        }
        console.log('Warning: the action(s) on 3 clicks will run just before the puck reboots.');
    } else {
        actions[3] = () => rebootPuck(3);
    }


    let handleButtonClick = () => {
        if (! actions[buttonClicks]) {
            LedDancer.dance(leds, 250, 2);
        } else if (actions[buttonClicks] instanceof Array) {
            actions[buttonClicks].forEach(bc => bc());
        } else {
            actions[buttonClicks]();
        }
        clickTimeout = null;
        buttonClicks = 0;
        lastClick = null;
    }

    setWatch(function() {
        if (lastClick !== null && getTime() - lastClick < delayBetweenClicks) {
            clearTimeout(clickTimeout);
        }
        buttonClicks++;
        lastClick = getTime();
        clickTimeout = setTimeout(handleButtonClick, delayBetweenClicks);
    }, BTN, { repeat: true, edge:"rising", debounce:50 });
}

