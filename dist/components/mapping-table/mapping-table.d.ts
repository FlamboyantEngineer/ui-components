import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type MappingTableColumn, type MappingTableSuggest, type MappingTableTarget, type MappingTableValue } from './mapping.js';
export interface MappingTableProps extends BaseProps, AriaLabellingProps {
    /** The source columns, one row each, in order. */
    columns: readonly MappingTableColumn[];
    /** The fields the columns can be imported into, in the order the choices list them. */
    targets: readonly MappingTableTarget[];
    /** The mapping, controlled. */
    value?: MappingTableValue | undefined;
    /** The mapping to start with, uncontrolled. Defaults to the suggested mapping. */
    defaultValue?: MappingTableValue | undefined;
    /** Called with the whole new mapping after each choice. */
    onChange?: ((value: MappingTableValue) => void) | undefined;
    /** Suggests each column's target; a choice that matches its suggestion is marked. */
    getSuggestion?: MappingTableSuggest | undefined;
    /** Shows the mapping with read-only choices. */
    isReadOnly?: boolean | undefined;
}
/**
 * Maps the columns of imported data to target fields: one row per source column with its name and
 * sample values, and a choice of target with a "Don't import" option. Suggested choices are marked,
 * a target chosen for several columns warns on each, and a summary counts the mapped and skipped
 * columns and names the required targets still unmapped. The mapping is plain data.
 */
export declare function MappingTable({ columns, targets, value, defaultValue, onChange, getSuggestion, isReadOnly, className, 'aria-label': ariaLabel, ...rest }: MappingTableProps): import("react").JSX.Element;
export { suggestMapping, summarizeMapping } from './mapping.js';
export type { MappingSummary, MappingTableColumn, MappingTableSuggest, MappingTableTarget, MappingTableValue, } from './mapping.js';
//# sourceMappingURL=mapping-table.d.ts.map