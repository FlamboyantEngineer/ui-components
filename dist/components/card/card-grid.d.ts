import { type ReactElement, type ReactNode } from 'react';
import type { AriaLabellingProps, CollectionSelectionProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
/** `grid` lines cards up in rows and columns; `waterfall` stacks cards of different heights in columns. */
export type CardGridLayout = 'grid' | 'waterfall';
/** The smallest size, in pixels, the virtual layout gives a card. */
export interface CardGridItemSize {
    width: number;
    height: number;
}
export interface CardGridProps<T extends object> extends BaseProps, AriaLabellingProps, CollectionSelectionProps {
    /** The cards as data, drawn by the function in `children`. */
    items?: Iterable<T> | undefined;
    /** `CardGridItem`s, or a function drawing one from each of `items`. */
    children?: ReactNode | ((item: T) => ReactElement);
    /** Values that, when they change, redraw the items drawn from `items`. */
    dependencies?: readonly unknown[] | undefined;
    /** Called with the key of the card the reader opens. */
    onAction?: ((key: Key) => void) | undefined;
    /** How the cards are laid out. Defaults to `grid`; `waterfall` always renders only the cards in view. */
    layout?: CardGridLayout | undefined;
    /** Renders only the cards in view; the stylesheet must bound the grid's height. */
    virtualized?: boolean | undefined;
    /** The smallest card size in the virtual layout. Defaults to 200 by 200 pixels. */
    minItemSize?: CardGridItemSize | undefined;
    /** Asks for more cards when the end of the grid scrolls into view. */
    onLoadMore?: (() => void) | undefined;
    /** More cards are loading: a loading item follows the cards. */
    isLoading?: boolean | undefined;
    /** Draws the grid while it has no cards. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
/** The state a card grid item hands to a render function in its `children`. */
export interface CardGridItemState {
    /** Whether the item is selected, for the card's own `isSelected`. */
    isSelected: boolean;
}
export interface CardGridItemProps extends Omit<BaseProps, 'id'> {
    /** The item's key in the grid. */
    id?: Key | undefined;
    /** The text typeahead matches and the item's accessible name. */
    textValue?: string | undefined;
    /** Makes the item a link: opening it follows the address. */
    href?: string | undefined;
    /** Called when the reader opens this item, as well as the grid's `onAction`. */
    onAction?: (() => void) | undefined;
    /** The item's content, usually a `Card`, or a function drawing it from the item's state. */
    children?: ReactNode | ((state: CardGridItemState) => ReactNode);
}
/**
 * A collection of cards with two-dimensional arrow-key navigation, built on React Aria's grid list
 * in its grid layout: selection with checkboxes, actions, links, typeahead, a virtualized grid or
 * waterfall, loading more and an empty state.
 */
export declare function CardGrid<T extends object>({ items, children, dependencies, layout, virtualized, minItemSize, onLoadMore, isLoading, renderEmptyState, className, ...rest }: CardGridProps<T>): import("react").JSX.Element;
/**
 * One item of a `CardGrid`, usually holding a `Card`. While the grid selects with toggles, it draws
 * a selection checkbox before its content; a render function receives the item's `isSelected` for
 * the card.
 */
export declare function CardGridItem({ className, children, ...rest }: CardGridItemProps): import("react").JSX.Element;
//# sourceMappingURL=card-grid.d.ts.map