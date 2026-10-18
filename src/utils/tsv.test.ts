import { describe, expect, it } from 'vitest';
import { formatTsv, parseTsv } from './tsv.js';

describe('tab-separated text', () => {
  it('UIC-TABLE-14.9 formats rows with tabs and line breaks, quoting cells that need it', () => {
    expect(
      formatTsv([
        ['Apple', '180'],
        ['Banana', ''],
      ]),
    ).toBe('Apple\t180\nBanana\t');
    expect(formatTsv([['a\tb', 'say "hi"', 'two\nlines']])).toBe(
      '"a\tb"\t"say ""hi"""\t"two\nlines"',
    );
    expect(formatTsv([])).toBe('');
  });

  it('UIC-TABLE-14.9 parses rows, quoted cells, Windows line breaks and a final line break', () => {
    expect(parseTsv('Apple\t180\r\nBanana\t120\r\n')).toEqual([
      ['Apple', '180'],
      ['Banana', '120'],
    ]);
    expect(parseTsv('"a\tb"\t"say ""hi"""\t"two\nlines"')).toEqual([
      ['a\tb', 'say "hi"', 'two\nlines'],
    ]);
    expect(parseTsv('one\t\tthree\t')).toEqual([['one', '', 'three', '']]);
    expect(parseTsv('mid"quote\t"open')).toEqual([['mid"quote', 'open']]);
    expect(parseTsv('"x"y\tz')).toEqual([['xy', 'z']]);
  });

  it('UIC-TABLE-14.9 reads empty text as no rows and a lone line break as one empty cell', () => {
    expect(parseTsv('')).toEqual([]);
    expect(parseTsv('\n')).toEqual([['']]);
  });

  it('UIC-TABLE-14.9 reads back what it formats', () => {
    const rows = [
      ['a', 'b\tc'],
      ['"d"', 'e\nf'],
    ];
    expect(parseTsv(formatTsv(rows))).toEqual(rows);
  });
});
