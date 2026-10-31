'use client';

import { useCallback, useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import type { TreeItemData, TreeProps } from './tree-props.js';
import { keyListCodec } from '../../utils/json-codec.js';

type TreeExpansionOptions = Pick<
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
    { codec: keyListCodec },
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
