import type { Key } from '../../core/props.js';
import type { TreeItemData, TreeItemState } from './tree.js';
import type { TreeRowOptions } from './tree-item.js';
/** What every row's content reads. */
export type RowContentOptions<T extends TreeItemData> = Pick<TreeRowOptions<T>, 'getTextValue' | 'getIcon' | 'renderLabel' | 'renderMeta' | 'renderActions' | 'expandGlyph' | 'checkboxSelection' | 'isIndeterminate' | 'rename' | 'loads'> & {
    isMovable: (key: Key) => boolean;
    hasReorder: boolean;
};
/**
 * One row's anatomy: drag handle, expand button or spacer, selection checkbox, icon, label, meta,
 * load error and actions.
 */
export declare function TreeRowContent<T extends TreeItemData>(props: {
    item: T;
    state: TreeItemState;
    hasCheckbox: boolean;
    options: RowContentOptions<T>;
}): import("react").JSX.Element;
//# sourceMappingURL=tree-row.d.ts.map