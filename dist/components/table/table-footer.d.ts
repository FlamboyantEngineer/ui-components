import type { JSX } from 'react';
import type { TableRow } from './table-rows.js';
import { type TableStructure } from './table-structure.js';
import type { TablePinOffsets } from './use-pinned-offsets.js';
interface TableFooterProps<T> {
    structure: TableStructure<T>;
    /** Every row the table presents, across pages. */
    rows: readonly T[];
    pinOffsets: TablePinOffsets;
}
/** The key of the summary row, kept out of row actions, selection and moves. */
export declare const footerRowId = "ui-table-footer";
/** Whether any drawn column has a summary cell. */
export declare function hasTableFooter<T>(structure: TableStructure<T>): boolean;
/**
 * The summary row under the rows: each data column's `renderFooter` from the rows the table
 * presents, and empty cells under the selection and actions columns.
 */
export declare function TableFooter<T extends TableRow>({ structure, rows, pinOffsets, }: TableFooterProps<T>): JSX.Element;
export {};
//# sourceMappingURL=table-footer.d.ts.map