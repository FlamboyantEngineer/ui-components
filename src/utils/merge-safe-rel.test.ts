import { describe, expect, it } from 'vitest';
import { isNewContextTarget, mergeSafeRel } from './merge-safe-rel.js';

describe('mergeSafeRel', () => {
  it('UIC-LINK-2.2 adds noopener and noreferrer to the caller rel for a new tab only', () => {
    expect(mergeSafeRel('_blank', undefined)).toBe('noopener noreferrer');
    expect(mergeSafeRel('_blank', 'nofollow')).toBe('nofollow noopener noreferrer');
    expect(mergeSafeRel('_blank', ' noreferrer  author ')).toBe('noreferrer author noopener');
    expect(mergeSafeRel('_self', 'nofollow')).toBe('nofollow');
    expect(mergeSafeRel(undefined, undefined)).toBeUndefined();
  });

  it('UIC-LINK-2.2 treats a named window and _blank in any letter case as a new browsing context', () => {
    expect(mergeSafeRel('preview', undefined)).toBe('noopener noreferrer');
    expect(mergeSafeRel('_BLANK', 'nofollow')).toBe('nofollow noopener noreferrer');
    for (const target of ['', '_self', '_parent', '_TOP', undefined]) {
      expect(isNewContextTarget(target)).toBe(false);
      expect(mergeSafeRel(target, 'author')).toBe('author');
    }
  });
});
