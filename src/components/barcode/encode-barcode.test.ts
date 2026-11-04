import { describe, expect, it } from 'vitest';
import { code128Values } from './code-128.js';
import { eanCheckDigit } from './ean.js';
import { type BarcodeFormat, encodeBarcode } from './encode-barcode.js';

/** The modules as `1` for a bar and `0` for a space. */
function bars(value: string, format: BarcodeFormat): string {
  return (
    encodeBarcode(value, format)
      .symbol?.modules.map((dark) => (dark ? '1' : '0'))
      .join('') ?? ''
  );
}

/**
 * Symbols an independent reader (ZXing 0.21's one-dimensional readers) decoded back to their text
 * when these vectors were recorded; the EAN, UPC and Code 128 values are the standards' examples.
 */
const vectors: Array<[BarcodeFormat, string, string]> = [
  [
    'ean13',
    '4006381333931',
    '10100011010100111010111101111010001001011001101010100001010000101000010111010010000101100110101',
  ],
  [
    'upca',
    '036000291452',
    '10100011010111101010111100011010001101000110101010110110011101001100110101110010011101101100101',
  ],
  ['ean8', '96385074', '1010001011010111101111010110111010101001110111001010001001011100101'],
  [
    'code128',
    'Wikipedia',
    '11010010000111010001101000011010011000010010100001101001010011110010110010000100001001101000011010010010110000111100100101100011101011',
  ],
  [
    'code128',
    'PACK-0042-LISBON',
    '1101001000011101110110101000110001000100011010110001110100110111001001110110010011101100110010011101100111001010011011100100011011101100010001011011101000100010110001000111011010111000110100011000101100011101011',
  ],
];

describe('encodeBarcode', () => {
  it('UIC-BARCODE-1.4 matches the standard vectors an independent reader decoded', () => {
    for (const [format, value, expected] of vectors) {
      expect(bars(value, format)).toBe(expected);
      expect(encodeBarcode(value, format).symbol?.text).toBe(value);
    }
    expect(code128Values('Wikipedia')).toEqual([104, 55, 73, 75, 73, 80, 69, 68, 73, 65, 88]);
  });

  it('UIC-BARCODE-1.1 returns the symbol, its text and quiet zones, or why there is none', () => {
    expect(encodeBarcode('400638133393', 'ean13').symbol).toMatchObject({
      format: 'ean13',
      text: '4006381333931',
      quietZone: [11, 7],
    });
    expect(encodeBarcode('ABC', 'code128').symbol).toMatchObject({
      text: 'ABC',
      quietZone: [10, 10],
    });
    expect(encodeBarcode('03600029145', 'upca').symbol?.quietZone).toEqual([9, 9]);
    expect(encodeBarcode('9638507', 'ean8').symbol?.quietZone).toEqual([7, 7]);
    expect(encodeBarcode('4006381333932', 'ean13')).toEqual({ invalid: 'checksum' });
  });

  it('UIC-BARCODE-1.2 chooses code sets by the characters ahead and adds the check symbol', () => {
    expect(code128Values('123456')).toEqual([105, 12, 34, 56, 44]);
    expect(code128Values('12345')).toEqual([105, 12, 34, 100, 21, 54]);
    expect(code128Values('A1234567B')).toEqual([104, 33, 17, 99, 23, 45, 67, 100, 34, 99]);
    expect(code128Values('X12345')).toEqual([104, 56, 17, 99, 23, 45, 87]);
    expect(code128Values('A123B')).toEqual([104, 33, 17, 18, 19, 34, 59]);
    expect(code128Values('Tab\there')).toEqual([104, 52, 65, 66, 101, 73, 100, 72, 69, 82, 69, 11]);
    expect(code128Values('\tA')[0]).toBe(103);
    for (const value of ['00', 'Wikipedia', 'Tab\there', 'a\u0001b', '~'.repeat(80)]) {
      const modules = encodeBarcode(value, 'code128').symbol?.modules ?? [];
      // Start, data and check symbols are 11 modules each; the stop pattern is 13.
      expect((modules.length - 13) % 11).toBe(0);
      expect(modules.at(0)).toBe(true);
      expect(modules.at(-1)).toBe(true);
    }
  });

  it('UIC-BARCODE-1.2 rejects empty, long and non-ASCII values', () => {
    expect(encodeBarcode('', 'code128')).toEqual({ invalid: 'length' });
    expect(encodeBarcode('x'.repeat(81), 'code128')).toEqual({ invalid: 'length' });
    expect(encodeBarcode('x'.repeat(80), 'code128').symbol).toBeDefined();
    expect(encodeBarcode('Café', 'code128')).toEqual({ invalid: 'characters' });
    expect(encodeBarcode('🍋', 'code128')).toEqual({ invalid: 'characters' });
  });

  it('UIC-BARCODE-1.3 adds or checks the check digit and rejects other values', () => {
    expect(eanCheckDigit('400638133393')).toBe(1);
    expect(eanCheckDigit('03600029145')).toBe(2);
    expect(eanCheckDigit('9638507')).toBe(4);
    expect(eanCheckDigit('590123412345')).toBe(7);
    expect(encodeBarcode('96385075', 'ean8')).toEqual({ invalid: 'checksum' });
    expect(encodeBarcode('036000291453', 'upca')).toEqual({ invalid: 'checksum' });
    expect(encodeBarcode('40063813339', 'ean13')).toEqual({ invalid: 'length' });
    expect(encodeBarcode('40063813339312', 'ean13')).toEqual({ invalid: 'length' });
    expect(encodeBarcode('', 'ean8')).toEqual({ invalid: 'length' });
    expect(encodeBarcode('4006-38133393', 'ean13')).toEqual({ invalid: 'characters' });
    expect(encodeBarcode('٤٠٠٦٣٨١٣٣٣٩٣', 'ean13')).toEqual({ invalid: 'characters' });
    expect(bars('400638133393', 'ean13')).toHaveLength(95);
    expect(bars('03600029145', 'upca')).toBe(bars('0036000291452', 'ean13'));
    expect(bars('9638507', 'ean8')).toHaveLength(67);
  });
});
