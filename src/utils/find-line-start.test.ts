import { describe, expect, it } from 'vitest';
import { findLineStart } from './find-line-start.js';

describe('findLineStart', () => {
  it('UIC-CODE-EDITOR-6.3 puts offset 0 on a line starting at 0, even before a leading line break', () => {
    expect(findLineStart('', 0)).toBe(0);
    expect(findLineStart('\nabc', 0)).toBe(0);
    expect(findLineStart('\nabc', 1)).toBe(1);
    expect(findLineStart('\n\n\nabc', 2)).toBe(2);
    expect(findLineStart('ab\ncd', 4)).toBe(3);
    expect(findLineStart('ab\n', 3)).toBe(3);
  });
});
