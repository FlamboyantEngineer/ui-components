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
});
