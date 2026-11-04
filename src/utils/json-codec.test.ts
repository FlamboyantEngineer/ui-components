import { describe, expect, it } from 'vitest';
import { isKey } from './is-key.js';
import {
  booleanCodec,
  createJsonCodec,
  keyCodec,
  keyListCodec,
  numberCodec,
} from './json-codec.js';

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

  it('UIC-PROVIDER-6.4 stores what write returns in place of the value', () => {
    const pair = createJsonCodec(
      (value) => [Number(value), 100 - Number(value)],
      (sizes: number[]) => sizes[0],
    );
    expect(pair.stringify([30, 70])).toBe('30');
    expect(pair.parse('30')).toEqual([30, 70]);
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

  it('UIC-PROVIDER-6.2 reads only keys as keys and finite numbers as numbers', () => {
    expect(keyCodec.parse('1')).toBe(1);
    expect(keyCodec.parse('"1"')).toBe('1');
    expect(numberCodec.parse('2.5')).toBe(2.5);
    for (const raw of ['{}', 'null', 'true']) {
      expect(() => keyCodec.parse(raw)).toThrow(TypeError);
      expect(() => numberCodec.parse(raw)).toThrow(TypeError);
    }
    expect(() => numberCodec.parse('"2"')).toThrow(TypeError);
  });

  it('UIC-PROVIDER-6.2 reads only booleans as booleans', () => {
    expect(booleanCodec.parse('false')).toBe(false);
    for (const raw of ['{}', '"true"', '1', 'null']) {
      expect(() => booleanCodec.parse(raw)).toThrow(TypeError);
    }
  });

  it('UIC-PROVIDER-6.2 ships the codecs from the core entry point', async () => {
    const core = await import('../core/index.js');
    expect(core.createJsonCodec).toBe(createJsonCodec);
    expect(core.numberCodec.parse('3')).toBe(3);
    expect(() => core.booleanCodec.parse('"yes"')).toThrow();
  });
});
