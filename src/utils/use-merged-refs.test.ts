import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useMergedRefs } from './use-merged-refs.js';

describe('useMergedRefs', () => {
  it('keeps one callback while the refs stay and hands the element to each', () => {
    const object = createRef<string>();
    const callback = vi.fn();
    const { result, rerender } = renderHook(({ second }) => useMergedRefs(object, second), {
      initialProps: { second: callback as (value: string | null) => void },
    });
    const first = result.current;
    rerender({ second: callback });
    expect(result.current).toBe(first);
    const cleanup = result.current('node');
    expect(object.current).toBe('node');
    expect(callback).toHaveBeenCalledWith('node');
    if (typeof cleanup === 'function') cleanup();
    expect(object.current).toBeNull();
    rerender({ second: vi.fn() });
    expect(result.current).not.toBe(first);
  });
});
