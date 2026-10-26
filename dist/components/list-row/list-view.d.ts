import { type ReactElement, type ReactNode } from 'react';
import type { AriaLabellingProps, CollectionSelectionProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type ListRowContentProps, type ListRowTone } from './list-row.js';
/** A reorder request: move `keys` before or after the row `targetKey`. */
export interface ListViewMove {
    /** The moved rows. */
    keys: Key[];
    /** The row the moved rows land beside. */
    targetKey: Key;
    /** Which side of the target they land on. */
    position: 'before' | 'after';
}
/** Opt-in row reordering by drag and drop. */
export interface ListViewReorderOptions {
    /** Reports one move. The list never reorders its rows itself: apply the move and re-render. */
    onMove: (move: ListViewMove) => void;
}
/** Rows as children, or a function drawing a row or section from each of `items`. */
export type ListViewChildren<T> = ReactNode | ((item: T) => ReactElement);
export interface ListViewProps<T extends object> extends BaseProps, AriaLabellingProps, CollectionSelectionProps {
    /** The rows or sections as data, drawn by the function in `children`. */
    items?: Iterable<T> | undefined;
    /** `ListViewItem`s and `ListViewSection`s, or a function drawing one from each of `items`. */
    children?: ListViewChildren<T>;
    /** Values that, when they change, redraw the rows drawn from `items`. */
    dependencies?: readonly unknown[] | undefined;
    /** Called with the key of the row the reader activates. */
    onAction?: ((key: Key) => void) | undefined;
    /** Ask the stylesheet for dividers between rows. */
    divided?: boolean | undefined;
    /** Ask the stylesheet to keep each section's header in view while its rows scroll under it. */
    stickyHeaders?: boolean | undefined;
    /** Turns on row reordering by drag and drop, by pointer or from a row's drag handle. */
    reorder?: ListViewReorderOptions | undefined;
    /** Renders only the rows in view; the stylesheet must bound the list's height. */
    virtualized?: boolean | undefined;
    /** Row height in pixels for a virtualized list. Defaults to 48. */
    rowHeight?: number | undefined;
    /** Asks for more rows when the end of the list scrolls into view. */
    onLoadMore?: (() => void) | undefined;
    /** More rows are loading: a loading row follows the rows. */
    isLoading?: boolean | undefined;
    /** Draws the list while it has no rows. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
export interface ListViewItemProps extends Omit<BaseProps, 'id'>, Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading'> {
    /** The row's key in the list. */
    id?: Key | undefined;
    /** The text typeahead matches. Defaults to a string `title`. */
    textValue?: string | undefined;
    /** Makes the row a link: pressing it or Enter follows the address. */
    href?: string | undefined;
    /** Controls after the row text, such as an action button; arrow keys reach them. */
    trailing?: ReactNode;
    /** Semantic emphasis, such as an overdue or failed item. Defaults to `neutral`. */
    tone?: ListRowTone | undefined;
}
export interface ListViewSectionProps<T extends object> extends Omit<BaseProps, 'id'> {
    /** The section's key in the list. */
    id?: Key | undefined;
    /** The section's header row, which also names the section. */
    title: string;
    /** The section's rows as data, drawn by the function in `children`. */
    items?: Iterable<T> | undefined;
    /** `ListViewItem`s, or a function drawing one from each of `items`. */
    children?: ListViewChildren<T>;
    /** Values that, when they change, redraw the rows drawn from `items`. */
    dependencies?: readonly unknown[] | undefined;
}
/**
 * A list of rows on React Aria's grid list: single or multiple selection with checkboxes, actions,
 * links, typeahead, sections, reordering by drag and drop, virtualization, loading more and an
 * empty state. For a plain list of links and buttons, use `List`.
 */
export declare function ListView<T extends object>({ items, children, dependencies, divided, stickyHeaders, reorder, virtualized, rowHeight, onLoadMore, isLoading, renderEmptyState, selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, onAction, className, ...rest }: ListViewProps<T>): import("react").JSX.Element;
/**
 * One row of a `ListView`: a drag handle while the list reorders, a selection checkbox while it
 * selects with toggles, the row text (`ListRowContent`) and trailing controls.
 */
export declare function ListViewItem({ id, title, meta, icon, leading, trailing, tone, textValue, className, ...rest }: ListViewItemProps): import("react").JSX.Element;
/** A titled run of rows in a `ListView` (React Aria `GridListSection` with a header row). */
export declare function ListViewSection<T extends object>({ id, title, items, dependencies, children, className, ...rest }: ListViewSectionProps<T>): import("react").JSX.Element;
//# sourceMappingURL=list-view.d.ts.map