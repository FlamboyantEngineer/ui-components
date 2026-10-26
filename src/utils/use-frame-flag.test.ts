import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFrameFlag } from './use-frame-flag.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useFrameFlag', () => {
  it('UIC-COMPLETION-LIST-1.2 opens when a caret anchor attaches after activation', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const owner: { current: Element | null } = { current: null };
    const { result } = renderHook(() => useFrameFlag(true, owner));
    expect(result.current).toBe(false);
    owner.current = document.body;
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(true);
  });

  it('UIC-COMBOBOX-2.3 UIC-COMPLETION-LIST-1.2 waits for focus scrolling on each activation', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const owner = { current: document.body };
    const { result, rerender } = renderHook(({ active }) => useFrameFlag(active, owner), {
      initialProps: { active: true },
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(true);
    rerender({ active: false });
    expect(result.current).toBe(false);
    rerender({ active: true });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(true);
  });

  it('UIC-COMBOBOX-2.3 UIC-COMPLETION-LIST-1.2 cancels opening when closed or unmounted before the frame', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const owner = { current: document.body };
    const { result, rerender, unmount } = renderHook(({ active }) => useFrameFlag(active, owner), {
      initialProps: { active: true },
    });
    rerender({ active: false });
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(result.current).toBe(false);
    rerender({ active: true });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-COMBOBOX-2.3 UIC-COMPLETION-LIST-1.2 ignores an obsolete zero-id frame after a rapid reopen', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return 0;
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const owner = { current: document.body };
    const { result, rerender } = renderHook(({ active }) => useFrameFlag(active, owner), {
      initialProps: { active: true },
    });
    rerender({ active: false });
    rerender({ active: true });
    act(() => frames[0]?.(0));
    expect(result.current).toBe(false);
    expect(cancel).toHaveBeenCalledWith(0);
    act(() => frames[1]?.(0));
    expect(result.current).toBe(true);
  });
});
