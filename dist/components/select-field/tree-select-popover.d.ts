import type { Key } from '../../core/props.js';
import { type TreeItemData } from '../tree/tree.js';
import { type TreeIndex } from './tree-index.js';
import type { SelectTreeFieldProps } from './select-tree-field.js';
export interface TreeSelectPopoverProps<T extends TreeItemData> extends Pick<SelectTreeFieldProps<T, 'single' | 'multiple'>, 'items' | 'getTextValue' | 'hasChildItems' | 'onLoadChildren'> {
    /** The field's label, which names the dialog, the search and the tree. */
    label: string;
    getChildren: (item: T) => readonly T[] | undefined;
    isMultiple: boolean;
    /** The chosen keys. */
    keys: readonly Key[];
    index: TreeIndex<T>;
    /** Choosing cascades through the hierarchy. */
    cascade: boolean;
    /** Called with the keys chosen now. */
    onChoose: (keys: Iterable<Key>) => void;
    /** Closes the popover. */
    onClose: () => void;
}
/**
 * The popover a tree select field opens. Its dialog mounts each time it opens, so the search starts
 * empty and the tree opens at the chosen nodes every time.
 */
export declare function TreeSelectPopover<T extends TreeItemData>(props: TreeSelectPopoverProps<T>): import("react").JSX.Element;
//# sourceMappingURL=tree-select-popover.d.ts.map