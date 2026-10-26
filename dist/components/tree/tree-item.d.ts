import { type JSX, type ReactElement, type ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import type { TreeExpandGlyph, TreeItemData, TreeProps } from './tree.js';
import type { TreeKeyDown } from './use-tree-key-down.js';
import type { TreeLoads } from './use-tree-loads.js';
import type { TreeRename } from './use-tree-rename.js';
import type { TreeReorder } from './use-tree-reorder.js';
/** The props and tree state that draw each row. */
export interface TreeRowOptions<T extends TreeItemData> extends Pick<TreeProps<T>, 'getTextValue' | 'hasChildItems' | 'isItemPending' | 'getHref' | 'isItemCurrent' | 'getIcon' | 'renderLabel' | 'renderMeta' | 'renderActions'> {
    /** Children of an item. */
    getChildren: (item: T) => readonly T[] | undefined;
    /** The expand button's glyphs. */
    expandGlyph: TreeExpandGlyph;
    /** Reordering, while the tree is reorderable. */
    reordering: TreeReorder | null;
    /** Records which item a row element draws. */
    registerRow: TreeKeyDown<T>['registerRow'];
    /** Whether rows draw a selection checkbox while the tree selects. */
    checkboxSelection: boolean;
    /** Whether a row holds some but not all selected descendants. */
    isIndeterminate: (key: Key) => boolean;
    /** In-place renaming, while the owner takes renames. */
    rename: TreeRename<T> | null;
    /** Loading children on demand, while the owner loads them. */
    loads: TreeLoads | null;
}
/** The notice an empty tree shows: a loading notice while pending, else the caller's message. */
export declare function TreeEmptyState(props: {
    isPending: boolean;
    emptyMessage: ReactNode;
}): JSX.Element;
/**
 * Draws an item as a row with its loaded children nested below it, or with a loading row when it
 * has children that are not loaded yet.
 */
export declare function useTreeItemRenderer<T extends TreeItemData>(options: TreeRowOptions<T>): (item: T) => ReactElement;
//# sourceMappingURL=tree-item.d.ts.map