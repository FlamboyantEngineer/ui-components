import { describe, expect, it } from 'vitest';
import { createJsonCodec } from './json-codec.js';
import { isKey } from './is-key.js';

describe('createJsonCodec', () => {
  const codec = createJsonCodec((value) => {
    if (!isKey(value)) throw new Error('Not a key');
    return value;
  });

  it('writes JSON and reads back what the reader accepts', () => {
    expect(codec.stringify('a')).toBe('"a"');
    expect(codec.parse('"a"')).toBe('a');
    expect(codec.parse('2')).toBe(2);
  });

  it('throws on stored data the reader refuses or that is not JSON', () => {
    expect(() => codec.parse('true')).toThrow('Not a key');
    expect(() => codec.parse('{')).toThrow(SyntaxError);
  });
});
