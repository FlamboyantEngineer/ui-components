import type { Key } from '../../core/props.js';
import { toCollectionSelectionProps } from '../../utils/collection-selection.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import type { TreeItemData, TreeProps } from './tree.js';
import type { TreeExpansion } from './use-tree-expansion.js';
import type { TreeSelection } from './use-tree-selection.js';

interface TreeAriaKeysOptions {
  selection: TreeSelection['props'];
  expansion: TreeExpansion;
  disabledKeys: Iterable<Key> | undefined;
  onAction: TreeProps<TreeItemData>['onAction'];
}

/** Collection primitives receive encoded ids; owners and tree models keep their original keys. */
export function createTreeAriaKeys(options: TreeAriaKeysOptions) {
  const { selection, expansion, disabledKeys, onAction } = options;
  return {
    ...toCollectionSelectionProps({ ...selection, disabledKeys }),
    expandedKeys: new Set([...expansion.expandedKeys].map(toCollectionKey)),
    onExpandedChange: (keys: Set<Key>) =>
      expansion.setExpandedKeys(new Set([...keys].map(fromCollectionKey))),
    onAction: onAction
      ? (key: Key) => {
          const original = fromCollectionKey(key);
          if (toCollectionKey(original) === key) onAction(original);
        }
      : undefined,
  };
}
