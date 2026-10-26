import { type TableColumnFilterValue } from './table-filters.js';
import type { TableColumn, TableRow } from './table-rows.js';
/** One column's filter: its value, where to report a new one, and the rows that list options. */
export interface TableColumnFilterProps<T extends TableRow> {
    column: TableColumn<T>;
    /** The column's accessible name. */
    label: string;
    value: TableColumnFilterValue | undefined;
    /** Reports the new value, or null to clear the filter. */
    onChange: (value: TableColumnFilterValue | null) => void;
    /** Every row given to the table, from which a `set` filter lists its values. */
    rows: readonly T[];
}
/**
 * A column header's filter button, which opens a popover holding the field of the column's filter
 * type and a button that clears it. The rows follow each change as it is made.
 */
export declare function TableColumnFilter<T extends TableRow>(props: TableColumnFilterProps<T>): import("react").JSX.Element;
//# sourceMappingURL=table-column-filter.d.ts.map