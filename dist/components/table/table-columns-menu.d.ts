import type { TableColumn } from './table-rows.js';
interface TableColumnsMenuProps<T> {
    /** Every column, in layout order. */
    columns: readonly TableColumn<T>[];
    hidden: readonly string[];
    onHiddenChange: (hidden: readonly string[]) => void;
}
/**
 * The columns menu: a checkable item per column that allows hiding, ticked while it is shown. The
 * menu stays open while columns are toggled.
 */
export declare function TableColumnsMenu<T>({ columns, hidden, onHiddenChange }: TableColumnsMenuProps<T>): import("react").JSX.Element;
export {};
//# sourceMappingURL=table-columns-menu.d.ts.map