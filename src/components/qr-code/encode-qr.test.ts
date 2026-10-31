import { describe, expect, it } from 'vitest';
import { encodeQr, type QrErrorCorrection, type QrSymbol } from './encode-qr.js';

/** The symbol drawn as rows of `#` (dark) and `.` (light). */
function drawRows(symbol: QrSymbol): string[] {
  return symbol.modules.map((row) => row.map((dark) => (dark ? '#' : '.')).join(''));
}

/** FNV-1a over the modules as `1` and `0`, row by row, to compare large symbols compactly. */
function digest(symbol: QrSymbol): string {
  let hash = 0x811c9dc5;
  for (const row of symbol.modules) {
    for (const dark of row) hash = Math.imul(hash ^ (dark ? 49 : 48), 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// Reference symbols from an independent encoder, in byte mode without raising the level.
const vectors: Array<
  [text: string, level: QrErrorCorrection, version: number, mask: number, digest: string]
> = [
  ['https://example.com/recipes/42', 'low', 2, 4, '3880f323'],
  ['https://example.com/recipes/42', 'medium', 3, 0, '81bc32a3'],
  ['https://example.com/recipes/42', 'quartile', 3, 0, 'bf152167'],
  ['https://example.com/recipes/42', 'high', 4, 0, '2cba1299'],
  ['x'.repeat(100), 'low', 5, 0, 'f13d504d'],
  ['x'.repeat(100), 'medium', 6, 3, '5df8c42f'],
  ['x'.repeat(100), 'quartile', 8, 0, 'b2b908ed'],
  ['x'.repeat(100), 'high', 10, 0, '37054f11'],
  ['q'.repeat(1200), 'low', 25, 0, '6da2f889'],
  ['q'.repeat(1200), 'medium', 29, 4, 'd6d83a74'],
  ['q'.repeat(1200), 'quartile', 34, 1, '1ce58586'],
  ['q'.repeat(1200), 'high', 39, 4, 'db1ac689'],
  ['k'.repeat(2331), 'low', 36, 1, '73e005ae'],
  ['k'.repeat(2331), 'medium', 40, 1, 'b4c1b88e'],
  ['Café crème — 東京 🍋', 'low', 2, 0, 'bf907e3b'],
  ['Café crème — 東京 🍋', 'medium', 3, 2, '86d5c94c'],
  ['Café crème — 東京 🍋', 'quartile', 3, 3, '0be17805'],
  ['Café crème — 東京 🍋', 'high', 4, 1, '14a608ef'],
];

describe('encodeQr', () => {
  it('UIC-QR-CODE-1.3 draws a known version 1 symbol module for module', () => {
    const symbol = encodeQr('hello');
    expect(symbol).toMatchObject({ version: 1, errorCorrection: 'medium', mask: 0, size: 21 });
    expect(drawRows(symbol as QrSymbol)).toEqual([
      '#######..##...#######',
      '#.....#.##....#.....#',
      '#.###.#..#.##.#.###.#',
      '#.###.#...##..#.###.#',
      '#.###.#.##..#.#.###.#',
      '#.....#.....#.#.....#',
      '#######.#.#.#.#######',
      '..........###........',
      '#.#.#.#..#.#....#..#.',
      '..#.##....#...#....##',
      '.#.#..#.###.#...#####',
      '##..#.........#....#.',
      '.##.#.##..#.#.#.#....',
      '........####.#.#..###',
      '#######...##.###..###',
      '#.....#...####.##....',
      '#.###.#.#.##.###...##',
      '#.###.#..#....##..##.',
      '#.###.#.###.#...#.#.#',
      '#.....#..#....#.#..#.',
      '#######.###.#.##...##',
    ]);
  });

  it('UIC-QR-CODE-1.3 draws a known version 2 symbol with its alignment pattern', () => {
    const symbol = encodeQr('Requirement 12', { errorCorrection: 'quartile' });
    expect(symbol).toMatchObject({ version: 2, errorCorrection: 'quartile', mask: 6, size: 25 });
    const rows = drawRows(symbol as QrSymbol);
    expect(rows.slice(16, 21)).toEqual([
      '#.###.####.###.##########',
      '........#..#...##...#...#',
      '#######....#.##.#.#.#.#.#',
      '#.....#.#.#.##..#...##...',
      '#.###.#.##...########..#.',
    ]);
    expect(digest(symbol as QrSymbol)).toBe(digestOfRows(rows));
  });

  it.each(vectors)(
    'UIC-QR-CODE-1.1 UIC-QR-CODE-1.2 UIC-QR-CODE-1.3 encodes %#: version and mask match the reference',
    (text, level, version, mask, expected) => {
      const symbol = encodeQr(text, { errorCorrection: level }) as QrSymbol;
      expect([symbol.version, symbol.mask, symbol.size]).toEqual([version, mask, version * 4 + 17]);
      expect(digest(symbol)).toBe(expected);
    },
  );

  it('UIC-QR-CODE-1.1 returns undefined for text too long for version 40', () => {
    expect(encodeQr('k'.repeat(2331))?.version).toBe(40);
    expect(encodeQr('k'.repeat(2332))).toBeUndefined();
    expect(encodeQr('k'.repeat(2953), { errorCorrection: 'low' })?.version).toBe(40);
    expect(encodeQr('é'.repeat(1477), { errorCorrection: 'low' })).toBeUndefined();
  });

  it('UIC-QR-CODE-1.3 draws the finder, timing and version patterns', () => {
    const symbol = encodeQr('x'.repeat(100), { errorCorrection: 'quartile' }) as QrSymbol;
    const rows = drawRows(symbol);
    const last = symbol.size - 1;
    for (const [x, y] of [
      [0, 0],
      [last - 6, 0],
      [0, last - 6],
    ] as const) {
      expect(rows[y]?.slice(x, x + 7)).toBe('#######');
      expect(rows[y + 2]?.slice(x, x + 7)).toBe('#.###.#');
    }
    expect(rows[6]?.slice(8, last - 7)).toMatch(/^(#\.)+#$/);
    // Version 8 writes its version bits (0x085bc, least significant first) beside the upper
    // right finder.
    expect(rows.slice(0, 6).map((row) => row.slice(last - 10, last - 7))).toEqual([
      '..#',
      '###',
      '.##',
      '.#.',
      '...',
      '#..',
    ]);
  });
});

function digestOfRows(rows: string[]): string {
  let hash = 0x811c9dc5;
  for (const char of rows.join(''))
    hash = Math.imul(hash ^ (char === '#' ? 49 : 48), 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
