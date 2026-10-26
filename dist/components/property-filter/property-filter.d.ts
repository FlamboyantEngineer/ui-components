import { type PropertyPanelProps } from '../property-panel/property-panel.js';
import { type PropertyScopeFilter } from '../property-scope/property-scope.js';
export interface PropertyFilterProps extends Omit<PropertyPanelProps, 'header' | 'aria-label' | 'aria-labelledby'> {
    /** Names the panel, and the search box from it (`Filter <label>`). */
    'aria-label': string;
    /** Placeholder text in the search box. */
    placeholder?: string | undefined;
    /** The query, controlled. */
    query?: string | undefined;
    /** The query to start from, uncontrolled. */
    defaultQuery?: string | undefined;
    /** Called with the query as the reader types or clears it. */
    onQueryChange?: ((query: string) => void) | undefined;
    /** Replaces term matching, as on `PropertyScope`. */
    filter?: PropertyScopeFilter | undefined;
}
/**
 * A property panel whose header holds a `SearchField` that filters every section, group, card and
 * row in the panel through a `PropertyScope`.
 */
export declare function PropertyFilter({ 'aria-label': label, placeholder, query: controlledQuery, defaultQuery, onQueryChange, filter, children, className, ...rest }: PropertyFilterProps): import("react").JSX.Element;
//# sourceMappingURL=property-filter.d.ts.map