import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControllableState } from './controllable-state.js';

describe('useControllableState', () => {
  it('holds its own value when uncontrolled and reports changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<string | null>(undefined, 'a', onChange),
    );
    expect(result.current[0]).toBe('a');
    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('follows the caller when controlled, even when the caller holds null', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) => useControllableState(value, 'a', onChange),
      { initialProps: { value: null as string | null } },
    );
    expect(result.current[0]).toBeNull();
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith('b');
    rerender({ value: 'b' });
    expect(result.current[0]).toBe('b');
  });
});
