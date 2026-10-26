import type { TableRow } from './table-rows.js';
import type { TableGridOptions } from './use-table-grid.js';
/**
 * The props a `Table` hands to React Aria's table as they are: labelling and selection behaviour.
 * The table holds the selected and expanded keys itself and hands them on controlled.
 */
export type TableAriaProps = Pick<TableGridOptions<TableRow>, (typeof ariaKeys)[number]>;
declare const ariaKeys: readonly ["aria-label", "aria-labelledby", "aria-describedby", "aria-details", "selectionMode", "selectionBehavior", "disabledKeys", "disallowEmptySelection"];
/** The props of a `Table` that React Aria's table takes as they are, such as labelling. */
export declare function pickAriaProps<T extends TableRow>(options: TableGridOptions<T>): TableAriaProps;
export {};
//# sourceMappingURL=table-props.d.ts.map