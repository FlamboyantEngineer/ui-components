import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDelayedFlag } from './use-delayed-flag.js';

afterEach(() => vi.useRealTimers());

describe('useDelayedFlag', () => {
  it('UIC-ACTION-BUTTON-1.7 UIC-LOADING-OVERLAY-3.2 waits again after activation or delay changes', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ active, delay }) => useDelayedFlag(active, delay), {
      initialProps: { active: true, delay: 100 },
    });
    act(() => vi.advanceTimersByTime(99));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    rerender({ active: true, delay: 200 });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    rerender({ active: false, delay: 200 });
    expect(result.current).toBe(false);
    rerender({ active: true, delay: 200 });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe(true);
  });

  it('UIC-SAVE-STATUS-1.4 stops and resets when the delay is removed', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ delay }) => useDelayedFlag(true, delay), {
      initialProps: { delay: 100 as number | undefined },
    });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(true);
    rerender({ delay: undefined });
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    rerender({ delay: 100 });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(true);
  });

  it('UIC-SAVE-STATUS-1.4 waits one timer turn even when the delay is zero', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDelayedFlag(true, 0));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe(true);
  });

  it('UIC-ACTION-BUTTON-1.7 UIC-LOADING-OVERLAY-3.2 clears a pending timer when deactivated or unmounted', () => {
    vi.useFakeTimers();
    const { result, rerender, unmount } = renderHook(({ active }) => useDelayedFlag(active, 100), {
      initialProps: { active: true },
    });
    act(() => vi.advanceTimersByTime(50));
    rerender({ active: false });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(false);
    rerender({ active: true });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
