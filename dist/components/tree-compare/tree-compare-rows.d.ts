import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { CompareTreeNode, ComparedTreeRow } from '../../utils/compare-trees.js';
/** The rows in reading order, with each row's position and ancestors, whatever is expanded. */
export interface TreeCompareRowIndex<T extends CompareTreeNode> {
    /** Every row, parents before children. */
    order: Array<ComparedTreeRow<T>>;
    /** Each row's place in `order`, by id. */
    position: Map<Key, number>;
    /** Each child row's immediate parent. Root rows have no entry. */
    parent: Map<Key, Key>;
    /** Each row by its original id. */
    byId: Map<Key, ComparedTreeRow<T>>;
}
/** The rows that differ, with the rows above them as context. */
export declare function filterChangedRows<T extends CompareTreeNode>(rows: ReadonlyArray<ComparedTreeRow<T>>): Array<ComparedTreeRow<T>>;
/** The ids of the rows with a difference somewhere below them. */
export declare function collectKeysAboveChanges<T extends CompareTreeNode>(rows: ReadonlyArray<ComparedTreeRow<T>>): Set<Key>;
export declare function indexRows<T extends CompareTreeNode>(rows: ReadonlyArray<ComparedTreeRow<T>>): TreeCompareRowIndex<T>;
/** The row with a difference after (`1`) or before (`-1`) the current row, wrapping around. */
export declare function findNextChange<T extends CompareTreeNode>(index: TreeCompareRowIndex<T>, { from, step }: {
    from: Key | null;
    step: 1 | -1;
}): ComparedTreeRow<T> | undefined;
/** A row's accessible name and typeahead text: its label and how it differs. */
export declare function nameRow<T extends CompareTreeNode>(row: ComparedTreeRow<T>, strings: UiStrings): string;
//# sourceMappingURL=tree-compare-rows.d.ts.map