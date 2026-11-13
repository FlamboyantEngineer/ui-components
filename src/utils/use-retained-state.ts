'use client';

import {
  createContext,
  type SetStateAction,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { createValueStore, type ValueStore } from './value-store.js';

/** Ephemeral interactive state retained while a virtualized owner is alive. */
export const RetainedStateContext = createContext<ValueStore<ReadonlyMap<string, unknown>> | null>(
  null,
);

/** Starts a fresh store when its owner's scope changes, including when a scope is revisited. */
export function useRetainedStateScope(scope: string | undefined) {
  const [held, setHeld] = useState(() => ({
    scope,
    store: createValueStore<ReadonlyMap<string, unknown>>(new Map()),
  }));
  if (held.scope === scope) return held.store;
  const next = { scope, store: createValueStore<ReadonlyMap<string, unknown>>(new Map()) };
  setHeld(next);
  return next.store;
}

/** Behaves like local state, retaining a keyed value across virtual unmounts within its owner. */
export function useRetainedState<T>(
  key: string | undefined,
  initial: T | (() => T),
): [T, (next: SetStateAction<T>) => void] {
  const store = use(RetainedStateContext);
  const [local, setLocal] = useState(initial);
  const read = (): T =>
    key !== undefined && store?.get().has(key) ? (store.get().get(key) as T) : local;
  const subscribe = (listener: () => void) => store?.subscribe(listener) ?? (() => undefined);
  const value = useSyncExternalStore(subscribe, read, read);
  const setValue = (next: SetStateAction<T>) => {
    if (!store || key === undefined) return setLocal(next);
    const updated = typeof next === 'function' ? (next as (value: T) => T)(read()) : next;
    store.set(new Map(store.get()).set(key, updated));
  };
  return [value, setValue];
}

/** Discards settled interaction state without discarding state on a virtual unmount. */
export function useRetainedStateReset(keys: readonly string[], resets: boolean): void {
  const store = use(RetainedStateContext);
  const signature = JSON.stringify(keys);
  useEffect(() => {
    if (!resets || !store) return;
    const next = new Map(store.get());
    for (const key of JSON.parse(signature) as string[]) next.delete(key);
    store.set(next);
  }, [store, signature, resets]);
}
