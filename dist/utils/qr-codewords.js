// QR codewords: capacities, byte-mode data, error correction blocks and interleaving
// (specs/QR-CODE.md).
import { computeErrorCorrection } from './qr-reed-solomon.js';
/** The smallest and largest QR versions. */
const qrMinVersion = 1;
const qrMaxVersion = 40;
/** Error correction codewords per block, by level, indexed by version (index 0 unused). */
const eccPerBlock = {
    low: [
        0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
        30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    medium: [
        0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
        28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    ],
    quartile: [
        0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
        30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    high: [
        0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
};
/** Error correction blocks, by level, indexed by version (index 0 unused). */
const blockCount = {
    low: [
        0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
        15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
    ],
    medium: [
        0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
        26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
    ],
    quartile: [
        0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
        34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
    ],
    high: [
        0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
        40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
    ],
};
const byteModeIndicator = 0b0100;
const padCodewords = [0xec, 0x11];
/** The modules of a version left for codewords once the function patterns are drawn. */
export function countRawDataModules(version) {
    let modules = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const alignments = Math.floor(version / 7) + 2;
        modules -= (25 * alignments - 10) * alignments - 55;
        if (version >= 7)
            modules -= 36;
    }
    return modules;
}
/** The data codewords a version holds at a level, once error correction takes its share. */
export function countDataCodewords(version, level) {
    const total = Math.floor(countRawDataModules(version) / 8);
    return total - (eccPerBlock[level][version] ?? 0) * (blockCount[level][version] ?? 0);
}
/** The width of the byte-mode character count: 8 bits up to version 9, then 16. */
function countBits(version) {
    return version < 10 ? 8 : 16;
}
/** The smallest version whose data codewords hold `length` bytes at `level`, if any does. */
export function selectQrVersion(length, level) {
    for (let version = qrMinVersion; version <= qrMaxVersion; version += 1) {
        const needed = 4 + countBits(version) + 8 * length;
        if (needed <= countDataCodewords(version, level) * 8)
            return version;
    }
    return undefined;
}
/** Appends the low `length` bits of `value` to `bits`, most significant first. */
function appendBits(bits, value, length) {
    for (let bit = length - 1; bit >= 0; bit -= 1)
        bits.push((value >>> bit) & 1);
}
/**
 * The data codewords of `bytes` in one byte-mode segment: the mode, the count, the bytes, a
 * terminator, zero bits to a whole codeword, then alternating pad codewords to fill the version.
 */
export function encodeDataCodewords(bytes, options) {
    const capacity = countDataCodewords(options.version, options.level) * 8;
    const bits = [];
    appendBits(bits, byteModeIndicator, 4);
    appendBits(bits, bytes.length, countBits(options.version));
    for (const byte of bytes)
        appendBits(bits, byte, 8);
    appendBits(bits, 0, Math.min(4, capacity - bits.length));
    appendBits(bits, 0, (8 - (bits.length % 8)) % 8);
    const codewords = [];
    for (let index = 0; index < bits.length; index += 8) {
        codewords.push(bits.slice(index, index + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
    }
    for (let pad = 0; codewords.length < capacity / 8; pad += 1) {
        codewords.push(padCodewords[pad % 2] ?? 0);
    }
    return codewords;
}
/**
 * Splits the data codewords into the version's blocks, appends each block's error correction
 * codewords, and interleaves the blocks column by column into the final codeword sequence.
 */
export function interleaveCodewords(data, options) {
    const { version, level } = options;
    const blocks = blockCount[level][version] ?? 1;
    const eccLength = eccPerBlock[level][version] ?? 0;
    const total = Math.floor(countRawDataModules(version) / 8);
    const shortBlocks = blocks - (total % blocks);
    const shortLength = Math.floor(total / blocks) - eccLength;
    const dataBlocks = [];
    const eccBlocks = [];
    let start = 0;
    for (let block = 0; block < blocks; block += 1) {
        const length = shortLength + (block < shortBlocks ? 0 : 1);
        const slice = data.slice(start, start + length);
        start += length;
        dataBlocks.push(slice);
        eccBlocks.push(computeErrorCorrection(slice, eccLength));
    }
    const sequence = [];
    for (let column = 0; column <= shortLength; column += 1) {
        for (const block of dataBlocks)
            if (column < block.length)
                sequence.push(block[column] ?? 0);
    }
    for (let column = 0; column < eccLength; column += 1) {
        for (const block of eccBlocks)
            sequence.push(block[column] ?? 0);
    }
    return sequence;
}
//# sourceMappingURL=qr-codewords.js.map