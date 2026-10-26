import type { BaseProps } from '../../core/props.js';
import type { LayoutElement, PolymorphicLayoutProps } from './layout.js';
/** Grid columns a cell covers, or `full` for the whole row. */
export type GridItemSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full';
/** Grid columns left empty before a cell. */
export type GridItemOffset = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export interface GridItemOwnProps extends BaseProps {
    /** Columns the cell covers. Defaults to 1. */
    span?: GridItemSpan | undefined;
    /** Columns left empty before the cell. Defaults to 0. */
    offset?: GridItemOffset | undefined;
}
export type GridItemProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, GridItemOwnProps>;
/** One cell of a `Grid` that covers several columns or starts after empty ones. */
export declare function GridItem<E extends LayoutElement = 'div'>({ as, children, className, span, offset, ...rest }: GridItemProps<E>): import("react").DetailedReactHTMLElement<Omit<GridItemProps<E>, "className" | "span" | "offset" | "children" | "as"> & {
    className: string;
} & import("../../core/hooks.js").DataAttributes, HTMLElement>;
//# sourceMappingURL=grid-item.d.ts.map