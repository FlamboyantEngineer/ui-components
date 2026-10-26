import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type PropertyScopeFilter } from './scope-tally.js';
export interface PropertyScopeProps extends BaseProps {
    /** The query as typed. Property rows below stay visible only while their texts hold every term. */
    query?: string | undefined;
    /**
     * Whether a row matches: called with the texts of its section, group and card, its label and its
     * keywords joined by spaces, and the query. Defaults to the texts holding every term.
     */
    filter?: PropertyScopeFilter | undefined;
    /** Shows a clear button in the no-match message, which calls this to empty the query. */
    onClear?: (() => void) | undefined;
    /** The property sections, groups, cards and rows the query filters. */
    children?: ReactNode;
}
/**
 * Filters the property sections, groups, cards and rows below it by a query the caller owns:
 * rows whose texts miss a term hide but stay mounted, matching containers open, matched text is
 * marked, and a status message reports a query nothing matches.
 */
export declare function PropertyScope({ query, filter, onClear, children, className, ...rest }: PropertyScopeProps): import("react").JSX.Element;
export { PropertyScopeContext, matchesPropertyScope, usePropertyScopeLevel, useReportPropertyTally, } from './scope-tally.js';
export type { PropertyScopeFilter } from './scope-tally.js';
//# sourceMappingURL=property-scope.d.ts.map