import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';

export interface CollapsedKeysOptions {
  /** The collapsed keys, controlled. */
  value: Iterable<Key> | undefined;
  /** The keys collapsed at first, uncontrolled. */
  defaultValue: Iterable<Key> | undefined;
  /** Called with the collapsed keys after each change. */
  onChange: ((keys: Set<Key>) => void) | undefined;
  /** Remembers the uncontrolled keys through the provider storage under this key. */
  storageKey: string | undefined;
}

/** Which columns or lanes are collapsed, and a toggle for one of them. */
export interface CollapsedKeys {
  keys: ReadonlySet<Key>;
  setCollapsed: (key: Key, isCollapsed: boolean) => void;
}

/**
 * The collapsed columns or lanes of a board: the caller's keys when controlled, otherwise its own,
 * remembered through the provider storage when given a storage key.
 */
export function useCollapsedKeys({
  value,
  defaultValue,
  onChange,
  storageKey,
}: CollapsedKeysOptions): CollapsedKeys {
  const [own, setOwn] = usePersistentState<Key[]>(
    value === undefined ? storageKey : undefined,
    () => [...(defaultValue ?? [])],
  );
  const keys = useMemo(() => new Set(value ?? own), [value, own]);
  return {
    keys,
    setCollapsed(key, isCollapsed) {
      const next = new Set(keys);
      if (isCollapsed) next.add(key);
      else next.delete(key);
      if (value === undefined) setOwn([...next]);
      onChange?.(next);
    },
  };
}
