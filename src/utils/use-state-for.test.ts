import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStateFor } from './use-state-for.js';

describe('useStateFor', () => {
  it('UIC-TEXT-DIFF-2.2 keeps its setter while the owner stays and resets for a new owner', () => {
    const first = {};
    const { result, rerender } = renderHook(({ owner }) => useStateFor(owner, 0), {
      initialProps: { owner: first },
    });
    const [, set] = result.current;
    act(() => set(2));
    expect(result.current[0]).toBe(2);
    expect(result.current[1]).toBe(set);
    rerender({ owner: {} });
    expect(result.current[0]).toBe(0);
    expect(result.current[1]).not.toBe(set);
  });

  it('UIC-TEXT-DIFF-2.2 UIC-SEARCH-PANE-2.2 starts from the initial value when an owner returns', () => {
    const { result, rerender } = renderHook(({ owner }) => useStateFor(owner, 0), {
      initialProps: { owner: 1 },
    });
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    rerender({ owner: 2 });
    expect(result.current[0]).toBe(0);
    rerender({ owner: 1 });
    expect(result.current[0]).toBe(0);
  });
});
