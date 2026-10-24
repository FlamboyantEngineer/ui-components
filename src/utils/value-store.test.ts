import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createValueStore, useStoreValue } from './value-store.js';

describe('createValueStore', () => {
  it('holds a value and notifies subscribers only when it changes', () => {
    const store = createValueStore<string | null>(null);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    expect(store.get()).toBeNull();
    store.set('a');
    store.set('a');
    expect(store.get()).toBe('a');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set('b');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('re-renders a reader through useStoreValue', () => {
    const store = createValueStore(1);
    const { result } = renderHook(() => useStoreValue(store));
    expect(result.current).toBe(1);
    act(() => store.set(2));
    expect(result.current).toBe(2);
  });
});
