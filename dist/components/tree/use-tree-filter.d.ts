import type { TreeItemData, TreeProps } from './tree.js';
import type { TreeExpansion } from './use-tree-expansion.js';
export interface TreeFilterOptions<T extends TreeItemData> extends Pick<TreeProps<T>, 'filterText' | 'filter'> {
    items: readonly T[];
    getChildren: (item: T) => readonly T[] | undefined;
    getTextValue: (item: T) => string;
    /** The expansion the tree shows while nothing filters. */
    expansion: TreeExpansion;
}
/** The rows a filtered tree shows, how to reach their children, and their expansion. */
export interface TreeFilter<T> {
    items: readonly T[];
    getChildren: (item: T) => readonly T[] | undefined;
    expansion: TreeExpansion;
}
/**
 * The tree as `filterText` filters it. While it is not blank, the rows whose text value matches
 * show, with their ancestors (expanded) and their descendants; expanding and collapsing then
 * changes a separate expansion, so the reader's own returns once the filter clears.
 */
export declare function useTreeFilter<T extends TreeItemData>(options: TreeFilterOptions<T>): TreeFilter<T>;
//# sourceMappingURL=use-tree-filter.d.ts.map