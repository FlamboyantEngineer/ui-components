'use client';

import { useSyncExternalStore } from 'react';

/**
 * One value that changes often, read by a few components only: setting it re-renders the components
 * that read it through `useStoreValue`, not the component that owns the store.
 */
export interface ValueStore<T> {
  get(): T;
  /** Replaces the value and notifies the readers, unless it is the same value. */
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

/** A store holding `initial` until it is set. */
export function createValueStore<T>(initial: T): ValueStore<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The store's value, re-rendering the caller when it changes. */
export function useStoreValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
