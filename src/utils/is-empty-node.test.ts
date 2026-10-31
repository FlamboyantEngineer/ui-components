import { describe, expect, it } from 'vitest';
import { isEmptyNode } from './is-empty-node.js';

describe('isEmptyNode', () => {
  it('treats nullish values, booleans and the empty string as empty', () => {
    for (const node of [null, undefined, true, false, '']) expect(isEmptyNode(node)).toBe(true);
    for (const node of [0, ' ', 'Text', []]) expect(isEmptyNode(node)).toBe(false);
  });

  it('also treats whitespace-only text as empty with isBlankEmpty', () => {
    const blank = { isBlankEmpty: true };
    for (const node of [null, '', ' ', '\n\t']) expect(isEmptyNode(node, blank)).toBe(true);
    for (const node of [0, ' a ', []]) expect(isEmptyNode(node, blank)).toBe(false);
  });
});
