import { describe, expect, it } from 'vitest';
import { requireDefined } from './require-defined.js';

describe('requireDefined', () => {
  it('UIC-REQUIRE-DEFINED-1.1 returns a present value unchanged', () => {
    const item = { id: 'apple' };
    expect(requireDefined([item][0])).toBe(item);
    expect(requireDefined(0)).toBe(0);
    expect(requireDefined('')).toBe('');
    expect(requireDefined(false)).toBe(false);
  });

  it('UIC-REQUIRE-DEFINED-1.1 throws when the value is missing', () => {
    expect(() => requireDefined(['apple'][1])).toThrow('Expected a value to be present.');
    expect(() => requireDefined(null)).toThrow(Error);
  });
});
