import { describe, expect, it } from 'vitest';
import {
  breakLine,
  deletePair,
  indentSelection,
  insertPair,
  outdentSelection,
  skipCloser,
  type CodeEdit,
} from './code-editing.js';

function caret(offset: number) {
  return { start: offset, end: offset };
}

/** The text after an edit, with `|` at a caret or `[` and `]` around the selection. */
function applied(value: string, edit: CodeEdit | null): string {
  if (!edit) return 'no edit';
  const text = `${value.slice(0, edit.start)}${edit.text}${value.slice(edit.end)}`;
  const { start, end } = edit.selection;
  if (start === end) return `${text.slice(0, start)}|${text.slice(start)}`;
  return `${text.slice(0, start)}[${text.slice(start, end)}]${text.slice(end)}`;
}

describe('code editing', () => {
  it('UIC-CODE-EDITOR-6.2 keeps the indentation on a new line and adds a level after an opener', () => {
    expect(applied('  let a', breakLine('  let a', caret(7), 2))).toBe('  let a\n  |');
    expect(applied('if (a) {', breakLine('if (a) {', caret(8), 2))).toBe('if (a) {\n  |');
    expect(applied('  call(x)', breakLine('  call(x)', caret(7), 4))).toBe('  call(\n      |x)');
    expect(applied('{}', breakLine('{}', caret(1), 2))).toBe('{\n  |\n}');
    expect(applied('  ab', breakLine('  ab', { start: 3, end: 4 }, 2))).toBe('  a\n  |');
  });

  it('UIC-CODE-EDITOR-6.3 indents to the next stop at a caret and every line of a selection', () => {
    expect(applied('ab', indentSelection('ab', caret(1), 2))).toBe('a |b');
    expect(applied('abc', indentSelection('abc', caret(1), 4))).toBe('a   |bc');
    expect(applied('one\n\ntwo', indentSelection('one\n\ntwo', { start: 0, end: 9 }, 2))).toBe(
      '[  one\n\n  two]',
    );
    expect(applied('one\ntwo', indentSelection('one\ntwo', { start: 1, end: 4 }, 2))).toBe(
      '  o[ne\n]two',
    );
    expect(applied('a b', indentSelection('a b', { start: 2, end: 3 }, 2))).toBe('  a [b]');
  });

  it('UIC-CODE-EDITOR-6.3 outdents each touched line by one level or nothing', () => {
    expect(applied('    a\n  b', outdentSelection('    a\n  b', { start: 4, end: 9 }, 2))).toBe(
      '  [a\nb]',
    );
    expect(applied('\ta', outdentSelection('\ta', caret(2), 2))).toBe('a|');
    expect(outdentSelection('a\nb', caret(1), 2)).toBeNull();
  });

  it('UIC-CODE-EDITOR-6.4 pairs brackets and quotes before space or a closer, and wraps a selection', () => {
    expect(applied('', insertPair('', caret(0), '('))).toBe('(|)');
    expect(applied('f()', insertPair('f()', caret(2), '['))).toBe('f([|])');
    expect(insertPair('ab', caret(1), '(')).toBeNull();
    expect(applied('a ', insertPair('a ', caret(2), '"'))).toBe('a "|"');
    expect(insertPair('it', caret(2), "'")).toBeNull();
    expect(applied('one two', insertPair('one two', { start: 4, end: 7 }, '{'))).toBe(
      'one {[two]}',
    );
    expect(insertPair('a', caret(1), 'x')).toBeNull();
  });

  it('UIC-CODE-EDITOR-6.4 steps over a closer and deletes an empty pair', () => {
    expect(applied('()', skipCloser('()', caret(1), ')'))).toBe('()|');
    expect(skipCloser('()', caret(1), ']')).toBeNull();
    expect(applied('x[]', deletePair('x[]', caret(2)))).toBe('x|');
    expect(applied("''", deletePair("''", caret(1)))).toBe('|');
    expect(deletePair('(a)', caret(1))).toBeNull();
    expect(deletePair('()', caret(0))).toBeNull();
  });
});
