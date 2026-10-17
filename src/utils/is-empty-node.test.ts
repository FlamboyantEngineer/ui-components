import { describe, expect, it } from 'vitest';
import { isEmptyNode } from './is-empty-node.js';

describe('isEmptyNode', () => {
  it('treats nullish values, booleans and the empty string as empty', () => {
    for (const node of [null, undefined, true, false, '']) expect(isEmptyNode(node)).toBe(true);
    for (const node of [0, ' ', 'Text', []]) expect(isEmptyNode(node)).toBe(false);
  });
});
