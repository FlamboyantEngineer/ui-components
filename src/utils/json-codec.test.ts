import { describe, expect, it } from 'vitest';
import { booleanCodec, createJsonCodec, keyListCodec } from './json-codec.js';
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

describe('stored list and boolean codecs', () => {
  it('UIC-PROVIDER-6.2 reads key lists with numeric and text keys kept apart', () => {
    expect(keyListCodec.parse('[1,"1","a"]')).toEqual([1, '1', 'a']);
    expect(keyListCodec.stringify([1, '1'])).toBe('[1,"1"]');
  });

  it.each(['{}', '"a"', '[null]', '[1,{}]', 'null'])(
    'UIC-PROVIDER-6.2 refuses %s as a key list',
    (raw) => {
      expect(() => keyListCodec.parse(raw)).toThrow(TypeError);
    },
  );

  it('UIC-PROVIDER-6.2 reads only booleans as booleans', () => {
    expect(booleanCodec.parse('false')).toBe(false);
    for (const raw of ['{}', '"true"', '1', 'null']) {
      expect(() => booleanCodec.parse(raw)).toThrow(TypeError);
    }
  });
});
