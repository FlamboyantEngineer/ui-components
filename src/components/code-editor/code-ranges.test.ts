import { describe, expect, it } from 'vitest';
import { findDiagnosticRange, findMatches, matchBracket } from './code-ranges.js';

const source = 'let total = 12\n  call(fruit)\n';

describe('code ranges', () => {
  it('UIC-CODE-EDITOR-3.4 marks a range, the word at a column or the text of a line', () => {
    expect(findDiagnosticRange(source, { message: 'x', line: 1, column: 5 })).toEqual({
      start: 4,
      end: 9,
    });
    expect(
      findDiagnosticRange(source, { message: 'x', line: 1, column: 5, endLine: 2, endColumn: 7 }),
    ).toEqual({ start: 4, end: 21 });
    expect(findDiagnosticRange(source, { message: 'x', line: 1, column: 11 })).toEqual({
      start: 10,
      end: 11,
    });
    expect(findDiagnosticRange(source, { message: 'x', line: 2 })).toEqual({ start: 17, end: 28 });
    expect(findDiagnosticRange('ab', { message: 'x', line: 1, column: 9 })).toEqual({
      start: 1,
      end: 2,
    });
    expect(findDiagnosticRange(source, { message: 'x', line: 3 })).toBeNull();
    expect(findDiagnosticRange(source, { message: 'x', line: 9, column: 1 })).toBeNull();
    expect(findDiagnosticRange(source, { message: 'x' })).toBeNull();
  });

  it('UIC-CODE-EDITOR-6.5 pairs the bracket at the caret, skipping strings and comments', () => {
    const text = 'f(a, "(", [b])';
    const tokens = [{ text: 'f(a, ' }, { text: '"("', type: 'string' }, { text: ', [b])' }];
    expect(matchBracket(text, tokens, 2)).toEqual({ at: 1, partner: 13 });
    expect(matchBracket(text, tokens, 14)).toEqual({ at: 13, partner: 1 });
    expect(matchBracket(text, tokens, 10)).toEqual({ at: 10, partner: 12 });
    expect(matchBracket(text, tokens, 6)).toBeNull();
    expect(matchBracket('(]', [{ text: '(]' }], 1)).toEqual({ at: 0, partner: null });
    expect(matchBracket('ab', [{ text: 'ab' }], 1)).toBeNull();
  });

  it('UIC-CODE-EDITOR-7.2 finds every match of a query ignoring case, without overlaps', () => {
    expect(findMatches('Apple apple aaa', 'apple')).toEqual([
      { start: 0, end: 5 },
      { start: 6, end: 11 },
    ]);
    expect(findMatches('aaaa', 'aa')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
    expect(findMatches('abc', '')).toEqual([]);
  });
});
