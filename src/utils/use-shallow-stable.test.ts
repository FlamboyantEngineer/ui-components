import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useShallowStable } from './use-shallow-stable.js';

describe('useShallowStable', () => {
  it('keeps the first object while every field stays the same', () => {
    const onPress = () => undefined;
    const { result, rerender } = renderHook(({ value }) => useShallowStable(value), {
      initialProps: { value: { size: 'md', onPress } as Record<string, unknown> },
    });
    const first = result.current;
    rerender({ value: { size: 'md', onPress } });
    expect(result.current).toBe(first);
    rerender({ value: { size: 'lg', onPress } });
    expect(result.current).toEqual({ size: 'lg', onPress });
    expect(result.current).not.toBe(first);
  });

  it('returns a new object when a field is added or removed', () => {
    const { result, rerender } = renderHook(({ value }) => useShallowStable(value), {
      initialProps: { value: { size: 'md' } as Record<string, unknown> },
    });
    const first = result.current;
    rerender({ value: { size: 'md', tone: undefined } });
    expect(result.current).not.toBe(first);
    const second = result.current;
    rerender({ value: { tone: undefined, other: undefined } });
    expect(result.current).not.toBe(second);
  });
});
