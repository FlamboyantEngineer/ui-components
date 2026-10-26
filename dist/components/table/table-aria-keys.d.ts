import type { Key, Selection } from '../../core/props.js';
import type { TableChildRows } from './table-tree.js';
import type { TableRow } from './table-rows.js';
import type { TableExpansion } from './use-table-expansion.js';
import type { TableSelection } from './use-table-selection.js';
interface TableAriaKeysOptions<T> {
    selection: TableSelection<T>;
    expansion: TableExpansion;
    disabledKeys: Iterable<Key> | undefined;
}
/** Indexes all source rows so callbacks retain keys of rows outside the current page. */
export declare function useTableKeyIndex<T extends TableRow>(rows: readonly T[], getChildRows: TableChildRows<T>, isEnabled: boolean): ReadonlyMap<string, Key>;
/** Internal notice, detail and group rows never report caller row actions. */
export declare function createTableRowAction(index: ReadonlyMap<string, Key>, onAction: ((key: Key) => void) | undefined): ((key: Key) => void) | undefined;
/** Keeps public row keys typed while the collection receives whitespace-safe identities. */
export declare function createTableAriaKeys<T>(options: TableAriaKeysOptions<T>): {
    selectedKeys: Selection;
    onSelectionChange: (keys: Selection) => void;
    disabledKeys: string[] | undefined;
    expandedKeys: Set<string>;
    onExpandedChange: (keys: Set<Key>) => void;
};
export {};
//# sourceMappingURL=table-aria-keys.d.ts.map