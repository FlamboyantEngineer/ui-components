import { describe, expect, it } from 'vitest';
import { omitUndefined } from './omit-undefined.js';

describe('omitUndefined', () => {
  it('drops undefined entries and keeps every other value', () => {
    const merged = { a: 1, b: 2, c: 3, ...omitUndefined({ a: undefined, b: 0, c: null }) };
    expect(merged).toEqual({ a: 1, b: 0, c: null });
  });
});
