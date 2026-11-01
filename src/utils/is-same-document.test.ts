import { describe, expect, it } from 'vitest';
import type { DocumentBlock } from './compare-blocks.js';
import { isSameDocument } from './is-same-document.js';

describe('isSameDocument', () => {
  it('UIC-REDLINE-COMPARE-3.1 matches rebuilt documents by their blocks and marks', () => {
    const block: DocumentBlock = {
      id: 'a',
      type: 'paragraph',
      text: 'Bake hot.',
      marks: [{ type: 'bold', start: 0, end: 4 }],
    };
    const copy = { ...block, marks: [{ type: 'bold' as const, start: 0, end: 4 }] };
    expect(isSameDocument([block], [copy])).toBe(true);
    expect(isSameDocument([block], [{ ...block, text: 'Bake warm.' }])).toBe(false);
    expect(
      isSameDocument([block], [{ ...copy, marks: [{ type: 'italic', start: 0, end: 4 }] }]),
    ).toBe(false);
    expect(isSameDocument([block], [block, block])).toBe(false);
    expect(isSameDocument([], [])).toBe(true);
  });
});
