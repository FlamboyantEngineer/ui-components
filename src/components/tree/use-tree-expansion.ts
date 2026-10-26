import { useCallback, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState, type PersistCodec } from '../../core/provider.js';
import type { TreeItemData, TreeProps } from './tree.js';

export type TreeExpansionOptions = Pick<
  TreeProps<TreeItemData>,
  'expandedKeys' | 'defaultExpandedKeys' | 'onExpandedChange' | 'persistKey'
>;

/** Which rows show their children, and how to change that. */
export interface TreeExpansion {
  /** The rows whose children show. */
  expandedKeys: Set<Key>;
  /** Shows and hides rows: stored unless controlled, then reported. */
  setExpandedKeys: (keys: Set<Key>) => void;
  /** Shows one row's children. */
  expand: (key: Key) => void;
}

const keyListCodec: PersistCodec<Key[]> = {
  parse(raw) {
    const value: unknown = JSON.parse(raw);
    if (!isKeyList(value)) throw new Error('Not a list of keys');
    return value;
  },
  stringify: (keys) => JSON.stringify(keys),
};

function isKeyList(value: unknown): value is Key[] {
  return (
    Array.isArray(value) && value.every((key) => typeof key === 'string' || typeof key === 'number')
  );
}

/**
 * Expansion that is controlled by `expandedKeys`, or owned by the tree from `defaultExpandedKeys`
 * and, with `persistKey`, kept in the provider's storage.
 */
export function useTreeExpansion({
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  persistKey,
}: TreeExpansionOptions): TreeExpansion {
  const isControlled = expandedKeys !== undefined;
  const [storedKeys, setStoredKeys] = usePersistentState<Key[]>(
    persistKey,
    () => (defaultExpandedKeys ? [...defaultExpandedKeys] : []),
    keyListCodec,
  );
  const expanded = useMemo(
    () => new Set<Key>(isControlled ? expandedKeys : storedKeys),
    [isControlled, expandedKeys, storedKeys],
  );
  const setExpandedKeys = useCallback(
    (keys: Set<Key>) => {
      if (!isControlled) setStoredKeys([...keys]);
      onExpandedChange?.(keys);
    },
    [isControlled, setStoredKeys, onExpandedChange],
  );
  const expand = useCallback(
    (key: Key) => {
      if (!expanded.has(key)) setExpandedKeys(new Set([...expanded, key]));
    },
    [expanded, setExpandedKeys],
  );
  return { expandedKeys: expanded, setExpandedKeys, expand };
}
