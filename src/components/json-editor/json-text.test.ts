import { describe, expect, it } from 'vitest';
import { findJsonError, formatJson, locateJsonError, tokenizeJson } from './json-text.js';

describe('tokenizeJson', () => {
  it('UIC-JSON-EDITOR-1.2 types keys, strings, numbers, literals, punctuation and invalid characters', () => {
    const source = '{"name": "Fig", "ripe": true, "weight": -1.5e2, "tags": [null], x}';
    const tokens = tokenizeJson(source);
    expect(tokens.map(({ text }) => text).join('')).toBe(source);
    const typed = tokens.filter(({ type }) => type).map(({ text, type }) => [text, type]);
    expect(typed).toEqual([
      ['{', 'punctuation'],
      ['"name"', 'key'],
      [':', 'punctuation'],
      ['"Fig"', 'string'],
      [',', 'punctuation'],
      ['"ripe"', 'key'],
      [':', 'punctuation'],
      ['true', 'literal'],
      [',', 'punctuation'],
      ['"weight"', 'key'],
      [':', 'punctuation'],
      ['-1.5e2', 'number'],
      [',', 'punctuation'],
      ['"tags"', 'key'],
      [':', 'punctuation'],
      ['[', 'punctuation'],
      ['null', 'literal'],
      [']', 'punctuation'],
      [',', 'punctuation'],
      ['x', 'invalid'],
      ['}', 'punctuation'],
    ]);
  });

  it('UIC-JSON-EDITOR-1.2 keeps escaped quotes inside strings and covers unterminated text', () => {
    const escaped = '"say \\"hi\\"" :';
    expect(tokenizeJson(escaped)[0]).toEqual({ text: '"say \\"hi\\""', type: 'key' });
    const open = '["unterminated';
    expect(tokenizeJson(open).map(({ text }) => text)).toEqual(['[', '"unterminated']);
    expect(tokenizeJson('')).toEqual([]);
  });
});

describe('JSON parse checks', () => {
  it('UIC-JSON-EDITOR-2.1 finds text that does not parse and accepts blank text', () => {
    expect(findJsonError('{"a": 1}')).toBeNull();
    expect(findJsonError('   ')).toBeNull();
    expect(findJsonError('{"a": 1,}')).not.toBeNull();
    expect(findJsonError('{"a":\n  1\n  "b": 2}')?.location).toEqual({ line: 3, column: 3 });
  });

  it('UIC-JSON-EDITOR-2.2 places the error at the first token that breaks the grammar', () => {
    const cases: Array<[string, { line: number; column: number }]> = [
      ['[1,]', { line: 1, column: 4 }],
      ['{\n  "fruit": \n}', { line: 3, column: 1 }],
      ['{"a" 1}', { line: 1, column: 6 }],
      ['{"a": 1', { line: 1, column: 8 }],
      ['[1] [2]', { line: 1, column: 5 }],
      ['{1: 2}', { line: 1, column: 2 }],
      ['[01]', { line: 1, column: 3 }],
      ['nul', { line: 1, column: 1 }],
    ];
    for (const [source, location] of cases)
      expect(findJsonError(source)?.location).toEqual(location);
  });

  it("UIC-JSON-EDITOR-2.2 falls back to the parser's place when the grammar holds", () => {
    const error = findJsonError('["a\\q"]');
    expect(error).not.toBeNull();
    expect(error?.location === null || error?.location?.line === 1).toBe(true);
  });

  it('UIC-JSON-EDITOR-2.2 reads the line and column from either form of parser message', () => {
    const source = '{\n  "a" 1\n}';
    expect(locateJsonError(source, 'Unexpected token at line 2 column 7 of the data')).toEqual({
      line: 2,
      column: 7,
    });
    expect(locateJsonError(source, "Expected ':' in JSON at position 8")).toEqual({
      line: 2,
      column: 7,
    });
    expect(locateJsonError(source, 'JSON Parse error: Unexpected identifier')).toBeNull();
  });

  it('UIC-JSON-EDITOR-2.2 locates a deep unfinished container without a call-stack limit', () => {
    const source = '{"a":['.repeat(20_000) + '1';
    expect(findJsonError(source)?.location).toEqual({ line: 1, column: source.length + 1 });
  });
});

describe('formatJson', () => {
  it('UIC-JSON-EDITOR-3.1 rewrites valid text with the indentation asked for', () => {
    expect(formatJson('{"a":[1,2]}', 2)).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    expect(formatJson('{"a":1}', 4)).toBe('{\n    "a": 1\n}');
    expect(formatJson('{"a":', 2)).toBeNull();
    expect(formatJson(' ', 2)).toBeNull();
  });

  it('UIC-JSON-EDITOR-3.1 formats deep values and retains native JSON normalization', () => {
    const source = '['.repeat(20_000) + '1' + ']'.repeat(20_000);
    expect(formatJson(source, 0)).toBe(source);
    const sample = '{"20":-0,"2":1e400,"a":1,"a":2,"__proto__":{"x":"\\\\"},"empty":[]}';
    for (const indent of [0, 2, 4, 20, -1, 1.5]) {
      expect(formatJson(sample, indent)).toBe(JSON.stringify(JSON.parse(sample), null, indent));
    }
  });
});
