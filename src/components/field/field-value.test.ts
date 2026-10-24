import { describe, expect, it, vi } from 'vitest';
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
