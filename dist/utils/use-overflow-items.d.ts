import { type RefCallback } from 'react';
import { type OverflowCollapseFrom } from './overflow-measure.js';
export { resolveOverflowCount } from './overflow-measure.js';
export type { OverflowCollapseFrom, OverflowCountInput } from './overflow-measure.js';
export interface OverflowItemsOptions<T> {
    /** Every item, in order. A new list (other length or other entries) is measured afresh. */
    items: readonly T[];
    /** Which end hidden items leave from. Defaults to `end`. */
    collapseFrom?: OverflowCollapseFrom | undefined;
    /**
     * An item's priority. Items with a lower priority are hidden first; items of the same priority
     * leave from `collapseFrom`. Defaults to 0 for every item.
     */
    getPriority?: ((item: T, index: number) => number) | undefined;
}
export interface OverflowItems<T> {
    /**
     * The container's ref. Its element children must be the rendered `visibleItems`, one element
     * each and in order, plus one indicator while `hiddenItems` is not empty: the element given
     * `indicatorRef`, or else the child at the collapsing end. The container's content box is the
     * room the items share.
     */
    containerRef: RefCallback<HTMLElement>;
    /**
     * For items inside an element of their own (a list with its own role), a child of the container:
     * its element children are then the rendered items, the indicator is the element given
     * `indicatorRef` (or the item container's neighbour at the collapsing end), and the container's
     * other element children keep their size.
     */
    itemContainerRef: RefCallback<HTMLElement>;
    /** The indicator's ref, for an indicator the caller places anywhere among the items. */
    indicatorRef: RefCallback<HTMLElement>;
    /** The items to render in the container. */
    visibleItems: readonly T[];
    /** The items that do not fit, in order, for the indicator (a "+N" count or a "more" menu). */
    hiddenItems: readonly T[];
}
/**
 * Measures which items fit in one row of a container and which overflow, for a row that collapses
 * items into a "+N" count or a "more" menu. Hidden items are not rendered. A new item list, new
 * priorities, and any change to the container's box or a rendered element's size render every item
 * once to measure it; the measuring commit and the solved one run back to back, before the browser
 * paints.
 */
export declare function useOverflowItems<T>({ items, collapseFrom, getPriority, }: OverflowItemsOptions<T>): OverflowItems<T>;
//# sourceMappingURL=use-overflow-items.d.ts.map