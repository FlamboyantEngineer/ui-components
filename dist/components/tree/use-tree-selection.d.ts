import type { Key } from '../../core/props.js';
import type { TreeItemData, TreeProps } from './tree.js';
export interface TreeSelectionOptions<T extends TreeItemData> extends Pick<TreeProps<T>, 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange' | 'selectionPropagation' | 'selectionMode'> {
    items: readonly T[];
    getChildren: (item: T) => readonly T[] | undefined;
    disabledKeys: Iterable<Key> | undefined;
}
/** The selection props to hand React Aria's tree, and the rows holding a partial selection. */
export interface TreeSelection {
    props: Pick<TreeProps<TreeItemData>, 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'>;
    /** Whether a row is not selected while some of its descendants are. */
    isIndeterminate: (key: Key) => boolean;
}
/**
 * React Aria's selection, passed through, or with `selectionPropagation` in multiple selection held
 * by the tree (unless controlled) and cascaded: a row whose selection changes takes its loaded, enabled descendants
 * along, and then each branch is selected exactly when all its enabled children are.
 */
export declare function useTreeSelection<T extends TreeItemData>(options: TreeSelectionOptions<T>): TreeSelection;
//# sourceMappingURL=use-tree-selection.d.ts.map