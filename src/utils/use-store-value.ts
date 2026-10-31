'use client';

import { useSyncExternalStore } from 'react';
import type { ValueStore } from './value-store.js';

/** The store's value, re-rendering the caller when it changes. */
export function useStoreValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
