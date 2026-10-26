import { type SelectOptionsDisplay } from './select-option.js';
import { type SelectFieldItem } from './select-options.js';
/** The next page of a search's results, loaded when the end of the list scrolls into view. */
export interface SelectListMore {
    isLoading: boolean;
    onLoadMore: () => void;
}
export interface SelectListProps extends SelectOptionsDisplay {
    /** The options and groups, in display order. */
    items: readonly SelectFieldItem[];
    /** Draws a filter input above the options. */
    isFilterable: boolean;
    /** Filters the options by the filter text; off when a search already chose them. */
    filtersLocally: boolean;
    filterText: string;
    onFilterTextChange: (text: string) => void;
    /** A search is running: a status line says so above the options it replaces. */
    isLoading: boolean;
    /** Shown when no option is listed. */
    emptyMessage: string;
    /** Renders only the options in view. */
    isVirtualized: boolean;
    /** Ends the list with a row that loads the next page; `null` when there is none. */
    more: SelectListMore | null;
}
/**
 * The open list of a select field: a popover on the `dropdown` layer holding the options and
 * groups, led by a filter input when the list is filterable. Focus stays in the filter while the
 * arrow keys move through the options.
 */
export declare function SelectList(props: SelectListProps): import("react").JSX.Element;
//# sourceMappingURL=select-list.d.ts.map