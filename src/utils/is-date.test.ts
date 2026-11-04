import { describe, expect, it } from 'vitest';
import { createFrameRealm } from '../../test/frame-realm.js';
import { isDate } from './is-date.js';

describe('isDate', () => {
  it('UIC-FIELD-2.3 recognises dates of this window and of a same-origin frame', () => {
    const realm = createFrameRealm();
    expect(isDate(new Date(2026, 10, 4))).toBe(true);
    expect(isDate(new realm.Date(2026, 10, 4))).toBe(true);
    expect(isDate(new realm.Date(Number.NaN))).toBe(true);
    expect(isDate('2026-11-04')).toBe(false);
    expect(isDate(Date.now())).toBe(false);
    expect(isDate({ getTime: () => 0 })).toBe(false);
    expect(isDate(null)).toBe(false);
  });
});
