class ByteTools {
    static copy(from, from_pos, to, to_pos, bytes) {
        for (let i = 0; i < bytes; i++) {
            to[i + to_pos] = from[i + from_pos];
        }
    }
}

module.exports = ByteTools;
