import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRetainedKey } from './use-retained-key.js';

type Props = { chosen: string | null | undefined; ids: string[] };

function renderRetained(initial: Props) {
  return renderHook(
    ({ chosen, ids }: Props) => useRetainedKey(chosen, (key) => ids.includes(key), ids[0]),
    { initialProps: initial },
  );
}

describe('useRetainedKey', () => {
  it('keeps the first item shown when others are added or reordered', () => {
    const { result, rerender } = renderRetained({ chosen: undefined, ids: ['a', 'b'] });
    expect(result.current).toBe('a');
    rerender({ chosen: undefined, ids: ['x', 'b', 'a'] });
    expect(result.current).toBe('a');
  });

  it('takes the first item of a collection that starts empty', () => {
    const { result, rerender } = renderRetained({ chosen: undefined, ids: [] });
    expect(result.current).toBeNull();
    rerender({ chosen: undefined, ids: ['a', 'b'] });
    expect(result.current).toBe('a');
    rerender({ chosen: undefined, ids: ['x', 'a'] });
    expect(result.current).toBe('a');
  });

  it('follows an eligible chosen key and falls back when the shown item goes', () => {
    const { result, rerender } = renderRetained({ chosen: 'b', ids: ['a', 'b'] });
    expect(result.current).toBe('b');
    rerender({ chosen: 'gone', ids: ['x', 'a', 'b'] });
    expect(result.current).toBe('b');
    rerender({ chosen: 'gone', ids: ['x', 'a'] });
    expect(result.current).toBe('x');
    rerender({ chosen: undefined, ids: ['y', 'x'] });
    expect(result.current).toBe('x');
  });

  it('keeps numeric and text keys of the same spelling apart', () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: Array<string | number> }) =>
        useRetainedKey<string | number>(undefined, (key) => ids.includes(key), ids[0]),
      { initialProps: { ids: [1, '1'] as Array<string | number> } },
    );
    expect(result.current).toBe(1);
    rerender({ ids: ['1', 1] });
    expect(result.current).toBe(1);
  });
});
