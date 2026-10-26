import { type QrErrorCorrection } from './qr-codewords.js';
export type { QrErrorCorrection } from './qr-codewords.js';
export interface QrEncodeOptions {
    /** How much damage the symbol survives. Defaults to `medium`. */
    errorCorrection?: QrErrorCorrection | undefined;
}
/** An encoded QR symbol, without its quiet zone. */
export interface QrSymbol {
    /** The version, from 1 (21 × 21 modules) to 40 (177 × 177). */
    version: number;
    errorCorrection: QrErrorCorrection;
    /** The mask pattern applied, from 0 to 7. */
    mask: number;
    /** Modules along each side: `version × 4 + 17`. */
    size: number;
    /** Rows of modules, top to bottom; true is dark. */
    modules: ReadonlyArray<readonly boolean[]>;
}
/**
 * Encodes `text` as UTF-8 bytes in the smallest QR version that holds them at the error
 * correction level, choosing the mask with the lowest penalty. Returns `undefined` when the text
 * is too long for version 40.
 */
export declare function encodeQr(text: string, options?: QrEncodeOptions): QrSymbol | undefined;
//# sourceMappingURL=encode-qr.d.ts.map