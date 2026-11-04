'use client';

// The one way a component persists a value the caller may also control. Shared by Navigation Rail,
// Tabs, Dock Panel and Split View.

import { useCallback } from 'react';
import { usePersistentState, type PersistCodec } from '../core/provider.js';

interface PersistedValueOptions<T> {
  /** The controlled value, which storage never overrides and which is never stored. */
  value: T | undefined;
  /** The value while nothing readable is stored, or a function that computes it once. */
  defaultValue: T | (() => T);
  /** Reports every change, controlled or not. */
  onChange?: ((value: T) => void) | undefined;
  /** Where the uncontrolled value persists through the provider storage; without it, plain state. */
  persistKey: string | undefined;
  /** Reads and writes the stored value; a stored value it cannot read gives the default. */
  codec: PersistCodec<T>;
}

/**
 * The caller's `value` while it is defined, else a value held by the component and persisted under
 * `persistKey` through the provider storage. Setting it stores it while uncontrolled and always
 * reports it through `onChange`.
 */
export function usePersistedValue<T>({
  value,
  defaultValue,
  onChange,
  persistKey,
  codec,
}: PersistedValueOptions<T>): [T, (next: T) => void] {
  const [own, setOwn] = usePersistentState(
    value === undefined ? persistKey : undefined,
    defaultValue,
    { codec },
  );
  const setValue = useCallback(
    (next: T) => {
      setOwn(next);
      onChange?.(next);
    },
    [setOwn, onChange],
  );
  return [value === undefined ? own : value, setValue];
}
