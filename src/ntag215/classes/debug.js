let enabled = false;
module.exports = function(callback) {
    if (callback === true || callback === false) {
        enabled = callback;
        return;
    }
    if (enabled) {
        callback();
    }
};
