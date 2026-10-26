/** How much of a symbol may be damaged and still read: about 7, 15, 25 or 30 percent. */
export type QrErrorCorrection = 'low' | 'medium' | 'quartile' | 'high';
/** The modules of a version left for codewords once the function patterns are drawn. */
export declare function countRawDataModules(version: number): number;
/** The data codewords a version holds at a level, once error correction takes its share. */
export declare function countDataCodewords(version: number, level: QrErrorCorrection): number;
/** The smallest version whose data codewords hold `length` bytes at `level`, if any does. */
export declare function selectQrVersion(length: number, level: QrErrorCorrection): number | undefined;
/**
 * The data codewords of `bytes` in one byte-mode segment: the mode, the count, the bytes, a
 * terminator, zero bits to a whole codeword, then alternating pad codewords to fill the version.
 */
export declare function encodeDataCodewords(bytes: Uint8Array, options: {
    version: number;
    level: QrErrorCorrection;
}): number[];
/**
 * Splits the data codewords into the version's blocks, appends each block's error correction
 * codewords, and interleaves the blocks column by column into the final codeword sequence.
 */
export declare function interleaveCodewords(data: readonly number[], options: {
    version: number;
    level: QrErrorCorrection;
}): number[];
//# sourceMappingURL=qr-codewords.d.ts.map