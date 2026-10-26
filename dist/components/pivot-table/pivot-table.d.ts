import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type PivotLayout, type PivotRecord } from '../../utils/pivot.js';
import { type PivotTableField } from './pivot-columns.js';
export type { PivotTableField } from './pivot-columns.js';
export interface PivotTableProps extends BaseProps, AriaLabellingProps, ExpansionProps {
    /** The records to pivot, as plain data. */
    records: readonly PivotRecord[];
    /** The fields the table offers: their labels, formats and the chooser's cards. */
    fields: readonly PivotTableField[];
    /** The row fields, column fields and values, controlled. */
    layout?: PivotLayout | undefined;
    /** The row fields, column fields and values at first, uncontrolled. */
    defaultLayout?: PivotLayout | undefined;
    /** Called with the layout after each change in the field chooser. */
    onLayoutChange?: ((layout: PivotLayout) => void) | undefined;
    /** Draws the field chooser above the table. */
    fieldChooser?: boolean | undefined;
}
/**
 * A pivot of plain records: rows grouped by row fields in expandable groups, columns by column
 * fields, cells aggregating value fields, with row and column totals and sortable columns, drawn
 * as a `Table`. An optional field chooser moves fields between rows, columns and values.
 */
export declare function PivotTable({ records, fields, layout, defaultLayout, onLayoutChange, fieldChooser, expandedKeys, defaultExpandedKeys, onExpandedChange, className, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, ...rest }: PivotTableProps): import("react").JSX.Element;
//# sourceMappingURL=pivot-table.d.ts.map