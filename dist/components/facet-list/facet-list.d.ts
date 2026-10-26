import type { BaseProps } from '../../core/props.js';
import { type FacetListOption } from './facet-options.js';
export interface FacetListProps extends BaseProps {
    /** The facet's name: the visible heading, which names the group of values. */
    label: string;
    /** The facet's values, in order. */
    options: readonly FacetListOption[];
    /** The ticked values, controlled. */
    value?: readonly string[] | undefined;
    /** The values ticked at first, uncontrolled. */
    defaultValue?: readonly string[] | undefined;
    /** Called with the ticked values, in option order, after each change. */
    onChange?: ((value: string[]) => void) | undefined;
    /** How many values show before the "show more" button. Defaults to 5. */
    limit?: number | undefined;
    /** Draws a search field that narrows the values. Defaults to on for more than 10 values. */
    filterable?: boolean | undefined;
    /** Lists the ticked values first. The order holds while focus is in the list. */
    selectedFirst?: boolean | undefined;
}
/**
 * The values of one facet as checkboxes with record counts, for narrowing a collection: an optional
 * search within the values, a fold past `limit` with a button to show the rest, and optionally the
 * ticked values first.
 */
export declare function FacetList({ label, options, value: controlledValue, defaultValue, onChange, limit, filterable, selectedFirst, className, id, ...rest }: FacetListProps): import("react").JSX.Element;
export type { FacetListOption } from './facet-options.js';
//# sourceMappingURL=facet-list.d.ts.map