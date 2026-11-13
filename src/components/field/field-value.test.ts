import { describe, expect, it, vi } from 'vitest';
import { createFrameRealm } from '../../../test/frame-realm.js';
import { isFieldValueEqual, toFieldValueKey } from './field-value.js';

describe('field values', () => {
  it('UIC-FIELD-2.3 compares values by structure, ignoring key order and identity', () => {
    expect(isFieldValueEqual({ b: [1, { c: 2 }], a: 'x' }, { a: 'x', b: [1, { c: 2 }] })).toBe(
      true,
    );
    expect(isFieldValueEqual({ a: 'x' }, { a: 'y' })).toBe(false);
    expect(isFieldValueEqual([1, 2], [2, 1])).toBe(false);
    expect(isFieldValueEqual(new Date(0), new Date(0))).toBe(true);
    expect(isFieldValueEqual(null, undefined)).toBe(false);
  });

  it('UIC-FIELD-2.3 keys invalid dates and big integers, and compares other objects by identity', () => {
    expect(isFieldValueEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
    expect(isFieldValueEqual(new Date(Number.NaN), new Date(0))).toBe(false);
    expect(isFieldValueEqual(10n, 10n)).toBe(true);
    expect(isFieldValueEqual(10n, 11n)).toBe(false);
    expect(isFieldValueEqual(10n, 10)).toBe(false);
    const map = new Map([['a', 1]]);
    expect(isFieldValueEqual(map, map)).toBe(true);
    expect(isFieldValueEqual(map, new Map([['b', 2]]))).toBe(false);
    expect(isFieldValueEqual(new Set([1]), new Set([2]))).toBe(false);
    const file = new File(['a'], 'a.txt');
    expect(isFieldValueEqual([file], [file])).toBe(true);
    expect(isFieldValueEqual([file], [new File(['b'], 'b.txt')])).toBe(false);
  });

  it('UIC-FIELD-2.3 walks an object value once however often it is compared', () => {
    const entries = vi.spyOn(Object, 'entries');
    const nested = { text: 'one' };
    const value = { type: 'doc', content: [nested] };
    const key = toFieldValueKey(value);
    expect(isFieldValueEqual(value, { content: [{ text: 'one' }], type: 'doc' })).toBe(true);
    expect(isFieldValueEqual(value, { type: 'doc', content: [] })).toBe(false);
    expect(toFieldValueKey(value)).toBe(key);
    const walks = (target: object) => entries.mock.calls.filter(([arg]) => arg === target).length;
    expect(walks(value)).toBe(1);
    expect(walks(nested)).toBe(1);
  });
});

describe('field values from another window', () => {
  it('UIC-FIELD-2.3 compares dates of a frame like local ones', () => {
    const realm = createFrameRealm();
    const first = new realm.Date(2026, 10, 4, 12);
    const second = new realm.Date(2026, 10, 5, 12);
    expect(isFieldValueEqual(first, second)).toBe(false);
    expect(isFieldValueEqual(first, new Date(2026, 10, 4, 12))).toBe(true);
    expect(toFieldValueKey(first)).toBe(toFieldValueKey(new Date(2026, 10, 4, 12)));
    expect(isFieldValueEqual({ due: first }, { due: second })).toBe(false);
  });
});
