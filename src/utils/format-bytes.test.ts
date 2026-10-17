import { describe, expect, it } from 'vitest';
import { formatBytes } from './format-bytes.js';

describe('formatBytes', () => {
  it('UIC-FORMAT-BYTES-1.1 picks the largest binary unit that keeps the size at 1 or more', () => {
    const cases: Array<[number, string]> = [
      [0, '0 B'],
      [1, '1 B'],
      [512, '512 B'],
      [1023, '1,023 B'],
      [1024, '1.0 KB'],
      [1536, '1.5 KB'],
      [1024 * 1024 - 1, '1,024.0 KB'],
      [5 * 1024 * 1024, '5.0 MB'],
      [1.25 * 1024 ** 3, '1.3 GB'],
      [3 * 1024 ** 4, '3.0 TB'],
      [2048 * 1024 ** 4, '2,048.0 TB'],
    ];
    for (const [bytes, text] of cases) expect(formatBytes(bytes, 'en-US')).toBe(text);
  });

  it('UIC-FORMAT-BYTES-1.1 rounds bytes to whole numbers', () => {
    expect(formatBytes(10.6, 'en-US')).toBe('11 B');
  });

  it('UIC-FORMAT-BYTES-1.2 writes decimals the way the locale does', () => {
    expect(formatBytes(1536, 'de-DE')).toBe('1,5 KB');
    expect(formatBytes(1536, 'en-GB')).toBe('1.5 KB');
  });

  it('UIC-FORMAT-BYTES-1.3 reads sizes that are not finite and positive as zero', () => {
    for (const bytes of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(formatBytes(bytes, 'en-US')).toBe('0 B');
    }
  });
});
