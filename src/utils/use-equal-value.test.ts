import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { isShallowEqual } from './is-shallow-equal.js';
import { useEqualValue } from './use-equal-value.js';

describe('useEqualValue', () => {
  it('keeps the first value while equal and takes the next one otherwise', () => {
    const { result, rerender } = renderHook(({ value }) => useEqualValue(value, isShallowEqual), {
      initialProps: { value: { size: 'md' } as Record<string, unknown> },
    });
    const first = result.current;
    rerender({ value: { size: 'md' } });
    expect(result.current).toBe(first);
    const next = { size: 'lg' };
    rerender({ value: next });
    expect(result.current).toBe(next);
    rerender({ value: { size: 'lg' } });
    expect(result.current).toBe(next);
  });

  it('keeps functions, which a lazy initial state would call, as values', () => {
    const run = () => 'ran';
    const { result } = renderHook(() => useEqualValue(run, () => false));
    expect(result.current).toBe(run);
  });
});
