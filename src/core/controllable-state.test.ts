import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControllableState } from './controllable-state.js';

describe('useControllableState', () => {
  it('UIC-COMPOSITION-5.1 holds its own value when uncontrolled and reports changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<string | null>(undefined, 'a', onChange),
    );
    expect(result.current[0]).toBe('a');
    act(() => result.current[1](null));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('UIC-COMPOSITION-5.1 follows the caller when controlled, even when the caller holds null', () => {
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

  it('UIC-COMPOSITION-5.1 reports no change when the new value is the current one', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: string | undefined }) => useControllableState(value, 'a', onChange),
      { initialProps: { value: 'a' as string | undefined } },
    );
    act(() => result.current[1]('a'));
    expect(onChange).not.toHaveBeenCalled();
    rerender({ value: undefined });
    act(() => result.current[1]('a'));
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledTimes(1);
    act(() => {
      result.current[1]('c');
      result.current[1]('b');
    });
    expect(onChange.mock.calls).toEqual([['b'], ['c'], ['b']]);
    const { result: notANumber } = renderHook(() => useControllableState(Number.NaN, 0, onChange));
    act(() => notANumber.current[1](Number.NaN));
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('UIC-COMPOSITION-5.1 compares a second set in the same event with the first', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<string>(undefined, 'a', onChange));
    act(() => {
      result.current[1]('b');
      result.current[1]('b');
    });
    expect(onChange.mock.calls).toEqual([['b']]);
    expect(result.current[0]).toBe('b');
    act(() => {
      result.current[1]('a');
      result.current[1]('b');
      result.current[1]('b');
    });
    expect(onChange.mock.calls).toEqual([['b'], ['a'], ['b']]);
    expect(result.current[0]).toBe('b');
    act(() => result.current[1]('b'));
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('UIC-COMPOSITION-5.1 compares a controlled set with the controlled value after uncontrolled use', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean | undefined }) => useControllableState(value, false, onChange),
      { initialProps: { value: undefined as boolean | undefined } },
    );
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    rerender({ value: false });
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(onChange.mock.calls).toEqual([[true], [true]]);
    act(() => result.current[1](false));
    expect(onChange).toHaveBeenCalledTimes(2);
    rerender({ value: undefined });
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledTimes(2);
    act(() => result.current[1](false));
    expect(onChange.mock.calls).toEqual([[true], [true], [false]]);
    expect(result.current[0]).toBe(false);
  });
});
