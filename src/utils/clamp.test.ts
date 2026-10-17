import { describe, expect, it } from 'vitest';
import { clamp } from './clamp.js';

describe('clamp', () => {
  it('UIC-CLAMP-1.1 limits a value to the inclusive range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12.5, 0, 10)).toBe(10);
    expect(clamp(-1.5, -2, -1)).toBe(-1.5);
    expect(clamp(Infinity, 0, 10)).toBe(10);
  });

  it('UIC-CLAMP-1.1 lets the minimum win when the range is inverted', () => {
    expect(clamp(5, 10, 0)).toBe(10);
  });
});
