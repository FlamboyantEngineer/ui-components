import { describe, expect, it } from 'vitest';
import { computeErrorCorrection } from './qr-reed-solomon.js';

describe('computeErrorCorrection', () => {
  it('UIC-QR-CODE-1.2 computes the error correction codewords of a known block', () => {
    // The data codewords of HELLO WORLD in a version 1 symbol at medium correction, from the
    // standard's worked example, and their ten error correction codewords.
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    expect(computeErrorCorrection(data, 10)).toEqual([
      196, 35, 39, 119, 235, 215, 231, 226, 93, 23,
    ]);
  });

  it('UIC-QR-CODE-1.2 returns zeros for an all-zero block', () => {
    expect(computeErrorCorrection([0, 0, 0], 7)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});
