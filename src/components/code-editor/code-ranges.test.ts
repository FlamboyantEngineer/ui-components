import { describe, expect, it, vi } from 'vitest';
import {
  createBracketMatcher,
  findDiagnosticRange,
  findMatches,
  toTextLines,
} from './code-ranges.js';

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
    const match = createBracketMatcher(text, tokens);
    expect(match(2)).toEqual({ at: 1, partner: 13 });
    expect(match(14)).toEqual({ at: 13, partner: 1 });
    expect(match(10)).toEqual({ at: 10, partner: 12 });
    expect(match(6)).toBeNull();
    expect(createBracketMatcher('(]', [{ text: '(]' }])(1)).toEqual({ at: 0, partner: null });
    expect(createBracketMatcher('ab', [{ text: 'ab' }])(1)).toBeNull();
  });

  it('UIC-CODE-EDITOR-6.5 rejects mismatched nested pairs in either direction', () => {
    for (const text of ['([})', '({])', '([{)}])']) {
      const match = createBracketMatcher(text, [{ text }]);
      expect(match(1)).toEqual({ at: 0, partner: null });
      expect(match(text.length)).toEqual({
        at: text.length - 1,
        partner: null,
      });
    }
    const text = '(([]))';
    const match = createBracketMatcher(text, [{ text }]);
    expect(match(1)).toEqual({ at: 0, partner: 5 });
    expect(match(6)).toEqual({ at: 5, partner: 0 });
  });

  it('UIC-CODE-EDITOR-6.5 skips many comment ranges while scanning brackets', () => {
    const tokens = [
      { text: '(' },
      ...Array.from({ length: 20000 }, () => ({ text: '/* [ */\n', type: 'comment' })),
      { text: ')' },
    ];
    const text = tokens.map((token) => token.text).join('');
    expect(createBracketMatcher(text, tokens)(1)).toEqual({ at: 0, partner: text.length - 1 });
  });

  it('UIC-CODE-EDITOR-6.5 skips token reads away from brackets and reads each token once on demand', () => {
    const count = 5000;
    const read = vi.fn(() => 'item ');
    const token = {
      type: 'key',
      get text() {
        return read();
      },
    };
    const plain = 'item '.repeat(count);
    const text = `${plain}([item])`;
    const match = createBracketMatcher(text, [
      ...Array<typeof token>(count).fill(token),
      { type: 'code', text: '([item])' },
    ]);
    for (let caret = 1; caret <= 100; caret += 1) expect(match(caret)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(match(plain.length)).toEqual({ at: plain.length, partner: text.length - 1 });
    expect(match(plain.length + 2)).toEqual({ at: plain.length + 1, partner: text.length - 2 });
    expect(match(text.length)).toEqual({ at: text.length - 1, partner: plain.length });
    expect(read).toHaveBeenCalledTimes(count);
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

  it('UIC-CODE-EDITOR-7.2 keeps source offsets after Unicode case changes and matches literal text', () => {
    expect(findMatches('İ apple APPLE', 'apple')).toEqual([
      { start: 2, end: 7 },
      { start: 8, end: 13 },
    ]);
    expect(findMatches('İ İ', 'İ')).toEqual([
      { start: 0, end: 1 },
      { start: 2, end: 3 },
    ]);
    expect(findMatches('a.*[b] A.*[B]', '.*[b]')).toEqual([
      { start: 1, end: 6 },
      { start: 8, end: 13 },
    ]);
    expect(findMatches('😀 X 𐐀', '𐐨')).toEqual([{ start: 5, end: 7 }]);
  });

  it('UIC-CODE-EDITOR-2.3 counts diagnostic lines again from the text start of an excerpt', () => {
    const diagnostics = [
      { message: 'a', line: 41, endLine: 42 },
      { message: 'b', column: 3 },
    ];
    expect(toTextLines(diagnostics, 1)).toBe(diagnostics);
    expect(toTextLines(diagnostics, 40)).toEqual([
      { message: 'a', line: 2, endLine: 3 },
      { message: 'b', column: 3, line: undefined, endLine: undefined },
    ]);
  });
});
