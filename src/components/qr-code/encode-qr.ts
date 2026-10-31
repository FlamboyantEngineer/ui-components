// Encodes text as a QR symbol: byte mode, versions 1 to 40, Reed–Solomon error correction and
// the least penalised mask (specs/QR-CODE.md).

import {
  encodeDataCodewords,
  interleaveCodewords,
  selectQrVersion,
  type QrErrorCorrection,
} from './qr-codewords.js';
import {
  QR_MASK_COUNT,
  applyMask,
  createQrGrid,
  drawFormatBits,
  placeCodewords,
} from './qr-matrix.js';
import { scoreQrPenalty } from './qr-penalty.js';

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
export function encodeQr(text: string, options: QrEncodeOptions = {}): QrSymbol | undefined {
  const errorCorrection = options.errorCorrection ?? 'medium';
  const bytes = new TextEncoder().encode(text);
  const version = selectQrVersion(bytes.length, errorCorrection);
  if (version === undefined) return undefined;
  const target = { version, level: errorCorrection };
  const codewords = interleaveCodewords(encodeDataCodewords(bytes, target), target);
  const grid = createQrGrid(version);
  placeCodewords(grid, codewords);
  let best = { mask: 0, penalty: Number.POSITIVE_INFINITY };
  for (let mask = 0; mask < QR_MASK_COUNT; mask += 1) {
    applyMask(grid, mask);
    drawFormatBits(grid, { level: errorCorrection, mask });
    const penalty = scoreQrPenalty(grid.modules);
    if (penalty < best.penalty) best = { mask, penalty };
    applyMask(grid, mask);
  }
  applyMask(grid, best.mask);
  drawFormatBits(grid, { level: errorCorrection, mask: best.mask });
  return { version, errorCorrection, mask: best.mask, size: grid.size, modules: grid.modules };
}
