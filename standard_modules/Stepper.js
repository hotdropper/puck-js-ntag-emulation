/* Copyright (c) 2015 Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission. */
/* Simple stepper motor module.

Usage:

```
var s = new require("Stepper").connect([C5,C6,C7,C8], [1,2,4,8], 0);
```

 */
function Stepper(pins, pattern, offpattern) {
  this.pins = pins;
  this.pattern = pattern;
  this.offpattern = offpattern;
  this.pos = 0;
  this.msPerStep = 10;
}

Stepper.prototype.setHome = function() {
  this.pos = 0;
};

Stepper.prototype.stop = function(turnOff) {
  if (this.interval) {
    clearInterval(this.interval);
    this.interval = undefined;
  }
  if (turnOff && this.offpattern!==undefined)
    digitalWrite(this.pins, this.offpattern);
};

Stepper.prototype.moveTo = function(pos, milliseconds, callback, turnOff) {
  pos = 0|pos; // to int
  if (milliseconds===undefined)
    milliseconds = Math.abs(pos-this.pos)*this.msPerStep;
  this.stop(turnOff);
  if (pos != this.pos) {
    var stepper = this;
    var step = function() {
      // remove interval if needed
      if (stepper.pos == pos) {
        stepper.stop(turnOff);
        if (callback)
          callback();
      } else {
        // move onwards
        stepper.pos += (pos < stepper.pos) ? -1 : 1;
        // now do step
        digitalWrite(stepper.pins, stepper.pattern[ stepper.pos & (stepper.pattern.length-1) ]);
      }
    };
    this.interval = setInterval(step, milliseconds / Math.abs(pos-this.pos));
    step();
  } else {
    if (callback)
      setTimeout(callback, milliseconds);
  }
};

exports.connect = function(pins, pattern, offpattern) {
  return new Stepper(pins, pattern, offpattern);
};
