import { describe, expect, it } from 'vitest';
import {
  countDataCodewords,
  countRawDataModules,
  encodeDataCodewords,
  interleaveCodewords,
  selectQrVersion,
} from './qr-codewords.js';

describe('QR codewords', () => {
  it('UIC-QR-CODE-1.1 knows the capacity of each version and level', () => {
    expect(countRawDataModules(1)).toBe(208);
    expect(countRawDataModules(7)).toBe(1568);
    expect(countRawDataModules(40)).toBe(29648);
    expect(countDataCodewords(1, 'low')).toBe(19);
    expect(countDataCodewords(1, 'high')).toBe(9);
    expect(countDataCodewords(40, 'low')).toBe(2956);
    expect(countDataCodewords(40, 'high')).toBe(1276);
  });

  it('UIC-QR-CODE-1.1 picks the smallest version that holds the bytes', () => {
    expect(selectQrVersion(0, 'medium')).toBe(1);
    expect(selectQrVersion(14, 'medium')).toBe(1);
    expect(selectQrVersion(15, 'medium')).toBe(2);
    expect(selectQrVersion(2953, 'low')).toBe(40);
    expect(selectQrVersion(2954, 'low')).toBeUndefined();
    expect(selectQrVersion(1273, 'high')).toBe(40);
    expect(selectQrVersion(1274, 'high')).toBeUndefined();
  });

  it('UIC-QR-CODE-1.1 writes one byte-mode segment, a terminator and pad codewords', () => {
    const codewords = encodeDataCodewords(new TextEncoder().encode('A'), {
      version: 1,
      level: 'medium',
    });
    expect(codewords).toEqual([
      64, 20, 16, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17, 236,
    ]);
    // Version 10 and up count bytes in 16 bits.
    const long = encodeDataCodewords(new Uint8Array(200), { version: 10, level: 'low' });
    expect(long.slice(0, 4)).toEqual([64, 12, 128, 0]);
    expect(long).toHaveLength(countDataCodewords(10, 'low'));
  });

  it('UIC-QR-CODE-1.2 interleaves short and long blocks, then their error correction', () => {
    // Version 5 at quartile has two blocks of 15 data codewords and two of 16, each with 18.
    const data = Array.from({ length: countDataCodewords(5, 'quartile') }, (_, index) => index);
    const sequence = interleaveCodewords(data, { version: 5, level: 'quartile' });
    expect(sequence).toHaveLength(Math.floor(countRawDataModules(5) / 8));
    expect(sequence.slice(0, 8)).toEqual([0, 15, 30, 46, 1, 16, 31, 47]);
    // After the 15th column, only the long blocks have a data codeword left.
    expect(sequence.slice(60, 62)).toEqual([45, 61]);
  });
});
