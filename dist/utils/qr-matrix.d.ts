import type { QrErrorCorrection } from './qr-codewords.js';
/** A square grid of modules being drawn, with the modules that belong to function patterns. */
export interface QrGrid {
    size: number;
    /** Rows of modules, top to bottom; true is dark. */
    modules: boolean[][];
    /** Rows of flags marking function modules, which data and masks leave alone. */
    reserved: boolean[][];
}
/** The number of masks a symbol can use. */
export declare const QR_MASK_COUNT: number;
/**
 * Writes the 15 format bits (level and mask with their BCH code) in both copies, and the dark
 * module beside the lower left finder.
 */
export declare function drawFormatBits(grid: QrGrid, options: {
    level: QrErrorCorrection;
    mask: number;
}): void;
/** A blank grid of `version` with its timing, finder, alignment and reserved format modules drawn. */
export declare function createQrGrid(version: number): QrGrid;
/** Writes the codewords' bits, most significant first, into the modules no function pattern holds. */
export declare function placeCodewords(grid: QrGrid, codewords: readonly number[]): void;
/** Inverts the data modules whose mask condition holds; applying the same mask again undoes it. */
export declare function applyMask(grid: QrGrid, mask: number): void;
//# sourceMappingURL=qr-matrix.d.ts.map