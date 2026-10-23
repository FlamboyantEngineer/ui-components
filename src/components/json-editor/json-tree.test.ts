import { describe, expect, it } from 'vitest';
import { findJsonContext, parseJsonTree } from './json-tree.js';

describe('JSON tree', () => {
  it('UIC-JSON-EDITOR-5.1 reads parsed text as a tree with source offsets', () => {
    const source = '{"fruit": "fig", "tags": [1, null]}';
    expect(parseJsonTree(source)).toEqual({
      kind: 'object',
      start: 0,
      end: 35,
      properties: [
        {
          key: 'fruit',
          start: 1,
          end: 8,
          value: { kind: 'scalar', start: 10, end: 15, value: 'fig' },
        },
        {
          key: 'tags',
          start: 17,
          end: 23,
          value: {
            kind: 'array',
            start: 25,
            end: 34,
            items: [
              { kind: 'scalar', start: 26, end: 27, value: 1 },
              { kind: 'scalar', start: 29, end: 33, value: null },
            ],
          },
        },
      ],
    });
    expect(parseJsonTree('{"a": }')).toBeNull();
    expect(parseJsonTree('  ')).toBeNull();
  });

  it('UIC-JSON-EDITOR-5.1 reads deeply nested arrays and objects without a call-stack limit', () => {
    const depth = 20_000;
    const source = '{"a":['.repeat(depth) + '1' + ']}'.repeat(depth);
    let node = parseJsonTree(source);
    for (let index = 0; index < depth; index += 1) {
      if (node?.kind !== 'object') throw new Error('Expected an object');
      const array = node.properties[0]?.value;
      if (array?.kind !== 'array') throw new Error('Expected an array');
      node = array.items[0] ?? null;
    }
    expect(node).toEqual({ kind: 'scalar', value: 1, start: depth * 6, end: depth * 6 + 1 });
  });

  it('UIC-JSON-EDITOR-5.2 finds the key or value at the caret in text that may not parse yet', () => {
    const at = (source: string) => {
      const caret = source.indexOf('|');
      const context = findJsonContext(source.replace('|', ''), caret);
      return context && { ...context, token: context.token?.text ?? null };
    };
    expect(at('{|}')).toEqual({ path: [], position: 'key', token: null, keys: [] });
    expect(at('{"a": 1, "b|": 2}')).toEqual({
      path: [],
      position: 'key',
      token: '"b"',
      keys: ['a', 'b'],
    });
    expect(at('{"a": {"c": |')).toEqual({
      path: ['a', 'c'],
      position: 'value',
      token: null,
      keys: ['c'],
    });
    expect(at('{"a": [1, "x|')).toEqual({
      path: ['a', 1],
      position: 'value',
      token: '"x',
      keys: [],
    });
    expect(at('{"a": {"c": 1}, |')).toMatchObject({ path: [], position: 'key', keys: ['a'] });
    expect(at('{"a": {"c": 1}, "|')).toMatchObject({ path: [], position: 'key', token: '"' });
    expect(at('|')).toEqual({ path: [], position: 'value', token: null, keys: [] });
    expect(at('[1]|')).toBeNull();
  });
});
