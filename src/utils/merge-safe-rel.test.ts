import { describe, expect, it } from 'vitest';
import { mergeSafeRel } from './merge-safe-rel.js';

describe('mergeSafeRel', () => {
  it('UIC-LINK-2.2 adds noopener and noreferrer to the caller rel for a new tab only', () => {
    expect(mergeSafeRel('_blank', undefined)).toBe('noopener noreferrer');
    expect(mergeSafeRel('_blank', 'nofollow')).toBe('nofollow noopener noreferrer');
    expect(mergeSafeRel('_blank', ' noreferrer  author ')).toBe('noreferrer author noopener');
    expect(mergeSafeRel('_self', 'nofollow')).toBe('nofollow');
    expect(mergeSafeRel(undefined, undefined)).toBeUndefined();
  });
});
