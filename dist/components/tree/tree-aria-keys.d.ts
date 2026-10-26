import type { Key } from '../../core/props.js';
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
export declare function createTreeAriaKeys(options: TreeAriaKeysOptions): {
    expandedKeys: Set<string>;
    onExpandedChange: (keys: Set<Key>) => void;
    onAction: ((key: Key) => void) | undefined;
    selectedKeys: import("../../core/props.js").Selection | undefined;
    defaultSelectedKeys: import("../../core/props.js").Selection | undefined;
    disabledKeys: string[] | undefined;
    onSelectionChange: ((keys: import("../../core/props.js").Selection) => void) | undefined;
};
export {};
//# sourceMappingURL=tree-aria-keys.d.ts.map