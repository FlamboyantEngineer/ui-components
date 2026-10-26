import { type ReactNode } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { type ElementRender } from '../../utils/render-element.js';
import { type OverflowCollapseFrom } from '../../utils/use-overflow-items.js';
/** The state an `OverflowList`'s `render` receives. */
export interface OverflowListRenderState {
    /** Some items do not fit and are left to the indicator. */
    isOverflowing: boolean;
}
export interface OverflowListProps<T> extends Omit<NativeProps<'div'>, 'children'>, BaseProps {
    /** Every item, in order. */
    items: readonly T[];
    /** Draws one item. `index` is the item's position in `items`. */
    renderItem: (item: T, index: number) => ReactNode;
    /** Draws the indicator for the items that do not fit, such as a "+N" count or a "more" menu. */
    renderOverflow: (hiddenItems: readonly T[]) => ReactNode;
    /** Which end hidden items leave from. Defaults to `end`. */
    collapseFrom?: OverflowCollapseFrom | undefined;
    /** Replaces the root `<div>`, for example with a toolbar; spread the props and ref onto it. */
    render?: ElementRender<'div', OverflowListRenderState> | undefined;
}
/**
 * One row of items that keeps as many as fit and hands the rest to an indicator at one end, such as
 * a "+N" count or a "more" menu. The row measures itself; the stylesheet lays it out on one line.
 */
export declare function OverflowList<T>({ items, renderItem, renderOverflow, collapseFrom, render, className, ref, ...rest }: OverflowListProps<T>): import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
export { VisibleCollection } from './visible-collection.js';
export type { VisibleCollectionProps } from './visible-collection.js';
//# sourceMappingURL=overflow-list.d.ts.map