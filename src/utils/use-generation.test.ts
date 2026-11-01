import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGeneration } from './use-generation.js';

describe('useGeneration', () => {
  it('UIC-TEXT-DIFF-1.7 keeps its count while the owner stays and counts each new owner', () => {
    const first = {};
    const { result, rerender } = renderHook(({ owner }) => useGeneration(owner), {
      initialProps: { owner: first },
    });
    expect(result.current).toBe(0);
    rerender({ owner: first });
    expect(result.current).toBe(0);
    rerender({ owner: {} });
    expect(result.current).toBe(1);
    rerender({ owner: first });
    expect(result.current).toBe(2);
  });
});
