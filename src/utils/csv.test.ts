import { describe, expect, it } from 'vitest';
import { CSV_BYTE_ORDER_MARK, formatCsv } from './csv.js';

describe('comma-separated values', () => {
  it('UIC-TABLE-16.1 joins cells with commas and rows with Windows line breaks', () => {
    expect(
      formatCsv([
        ['Name', 'Weight'],
        ['Apple', '180'],
      ]),
    ).toBe('Name,Weight\r\nApple,180');
    expect(formatCsv([])).toBe('');
    expect(formatCsv([['']])).toBe('');
  });

  it('UIC-TABLE-16.1 quotes cells holding the delimiter, quotes or line breaks', () => {
    expect(formatCsv([['a,b', 'say "hi"', 'two\nlines', 'cr\rhere', 'plain']])).toBe(
      '"a,b","say ""hi""","two\nlines","cr\rhere",plain',
    );
    expect(formatCsv([['a;b', 'c,d']], { delimiter: ';' })).toBe('"a;b";c,d');
  });

  it('UIC-TABLE-16.1 prefixes text a spreadsheet would read as a formula, keeping plain numbers', () => {
    expect(formatCsv([['=SUM(A1)', '+1+1', '-2+3', '@cmd', '\tx', '-12.5', '+3', 'a=b']])).toBe(
      "'=SUM(A1),'+1+1,'-2+3,'@cmd,'\tx,-12.5,+3,a=b",
    );
    expect(formatCsv([['=1,2']])).toBe(`"'=1,2"`);
    expect(formatCsv([['=SUM(A1)']], { escapeFormulas: false })).toBe('=SUM(A1)');
  });

  it('UIC-TABLE-16.1 refuses a delimiter that cannot separate cells', () => {
    expect(() => formatCsv([['a']], { delimiter: '"' })).toThrow(Error);
    expect(() => formatCsv([['a']], { delimiter: ',,' })).toThrow(Error);
    expect(() => formatCsv([['a']], { delimiter: '\n' })).toThrow(Error);
  });

  it('UIC-TABLE-16.1 names the UTF-8 byte order mark it leaves out', () => {
    expect(CSV_BYTE_ORDER_MARK).toBe('﻿');
    expect(formatCsv([['é']]).startsWith(CSV_BYTE_ORDER_MARK)).toBe(false);
  });
});
