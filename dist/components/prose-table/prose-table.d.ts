import type { ReactNode, TableHTMLAttributes } from 'react';
import type { BaseProps } from '../../core/props.js';
/** Text alignment of a column, as in Markdown's `:---`, `:---:` and `---:`. */
export type ProseTableAlign = 'start' | 'center' | 'end';
export interface ProseTableCell {
    /** Stable within its row or heading list. */
    key: string;
    content: ReactNode;
}
/** A column heading, with the options that apply to every cell of its column. */
export interface ProseTableColumn extends ProseTableCell {
    /** Alignment of the heading and the column's cells. Unset, the stylesheet decides. */
    align?: ProseTableAlign | undefined;
    /** The column's cells name their rows, as `<th scope="row">`. */
    isRowHeader?: boolean | undefined;
}
export interface ProseTableRow {
    /** Stable within the table. */
    key: string;
    cells: readonly ProseTableCell[];
}
export interface ProseTableProps extends BaseProps, Pick<TableHTMLAttributes<HTMLTableElement>, 'aria-label' | 'aria-labelledby'> {
    /** Column headings, one per column. */
    header: readonly ProseTableColumn[];
    /** Body rows. A row with fewer cells than headings is padded with empty cells. */
    rows: readonly ProseTableRow[];
    /** Footer rows, such as totals, after the body. Padded like body rows. */
    footer?: readonly ProseTableRow[] | undefined;
    /** Text that names the table, in a `<caption>`. Nullish, boolean and empty values add none. */
    caption?: ReactNode;
    /** Keep the column headings in view while a scrolling ancestor scrolls the rows. */
    stickyHeader?: boolean | undefined;
}
/** A static table inside running text: column headings, body and footer rows, nothing interactive. */
export declare function ProseTable({ header, rows, footer, caption, stickyHeader, className, ...rest }: ProseTableProps): import("react").JSX.Element;
//# sourceMappingURL=prose-table.d.ts.map