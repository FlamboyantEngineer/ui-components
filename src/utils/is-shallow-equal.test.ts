import { describe, expect, it } from 'vitest';
import { isShallowEqual } from './is-shallow-equal.js';

describe('isShallowEqual', () => {
  it('compares own fields with Object.is', () => {
    const onPress = () => undefined;
    expect(isShallowEqual({ width: 1, onPress }, { width: 1, onPress })).toBe(true);
    expect(isShallowEqual({ width: 1 }, { width: 2 })).toBe(false);
    expect(isShallowEqual({ width: Number.NaN }, { width: Number.NaN })).toBe(true);
    expect(isShallowEqual({ nested: {} }, { nested: {} })).toBe(false);
  });

  it('tells apart added, removed and renamed fields', () => {
    expect(isShallowEqual<object>({ width: 1 }, { width: 1, height: undefined })).toBe(false);
    expect(isShallowEqual<object>({ width: undefined }, { height: undefined })).toBe(false);
  });

  it('equals null and undefined only to themselves', () => {
    expect(isShallowEqual(null, null)).toBe(true);
    expect(isShallowEqual(undefined, undefined)).toBe(true);
    expect(isShallowEqual({}, null)).toBe(false);
    expect(isShallowEqual(null, undefined)).toBe(false);
  });
});
