import type { Key } from '../../core/props.js';
import type { TreeItemData, TreeProps } from './tree.js';
export type TreeExpansionOptions = Pick<TreeProps<TreeItemData>, 'expandedKeys' | 'defaultExpandedKeys' | 'onExpandedChange' | 'persistKey'>;
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
export declare function useTreeExpansion({ expandedKeys, defaultExpandedKeys, onExpandedChange, persistKey, }: TreeExpansionOptions): TreeExpansion;
//# sourceMappingURL=use-tree-expansion.d.ts.map