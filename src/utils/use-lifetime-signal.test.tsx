import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useLifetimeSignal } from './use-lifetime-signal.js';

describe('useLifetimeSignal', () => {
  it('UIC-FOLDER-MANAGER-2.5 aborts the signals of operations begun while mounted on unmount', () => {
    const { result, unmount } = renderHook(() => useLifetimeSignal(), { wrapper: StrictMode });
    const first = result.current();
    const second = result.current();
    expect(first.aborted).toBe(false);
    expect(second.aborted).toBe(false);
    unmount();
    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(true);
  });

  it('UIC-DECISION-CONTROL-1.4 keeps begin stable across renders', () => {
    const { result, rerender } = renderHook(() => useLifetimeSignal());
    const begin = result.current;
    rerender();
    expect(result.current).toBe(begin);
  });
});
