import { type ComponentPropsWithRef, type ReactElement } from 'react';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
export { ToolbarRow, ToolbarRowSeparator } from './toolbar-row.js';
/** A closed scale of spacing steps, smallest to largest. The stylesheet maps each step to a length. */
export type LayoutSpace = 'none' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type LayoutAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LayoutJustify = 'normal' | 'start' | 'center' | 'end' | 'between';
export type LayoutWrap = 'wrap' | 'nowrap';
/**
 * Growth inside a flex parent: `true` fills the free space from a zero basis, `auto` grows from the
 * content size, `none` neither grows nor shrinks, `false` keeps the default sizing.
 */
export type LayoutGrow = boolean | 'auto' | 'none';
export type PageWidth = 'full' | 'wide' | 'reading' | 'narrow';
/**
 * Column templates: a fixed count, `fit` (as many equal columns of at least `minColumnWidth` as fit,
 * down to one) or `none` (no template; the stylesheet or a caller class sets the tracks).
 */
export type GridColumns = 1 | 2 | 3 | 4 | 6 | 12 | 'fit' | 'none';
export type GridMinColumnWidth = Extract<Size, 'sm' | 'md' | 'lg' | 'xl'>;
/** The semantic elements a polymorphic layout primitive may render. */
export type LayoutElement = 'a' | 'article' | 'aside' | 'div' | 'dd' | 'dl' | 'dt' | 'fieldset' | 'figure' | 'footer' | 'form' | 'header' | 'label' | 'li' | 'main' | 'nav' | 'ol' | 'p' | 'section' | 'span' | 'ul';
export interface LayoutContainmentProps {
    /** Growth inside a flex parent. */
    grow?: LayoutGrow | undefined;
    /** Take the containing block's full block size. */
    fill?: boolean | undefined;
    /** Clip content that overflows this element. */
    clip?: boolean | undefined;
}
/** Own props plus the native props of the element chosen with `as`. */
export type PolymorphicLayoutProps<E extends LayoutElement, Own extends object> = Own & {
    /** The element to render. Defaults to `div`. */
    as?: E | undefined;
} & Omit<ComponentPropsWithRef<NoInfer<E>>, keyof Own | 'as' | 'style'>;
export type ViewProps = NativeProps<'section'> & BaseProps & LayoutContainmentProps;
export interface PageProps extends NativeProps<'section'>, BaseProps, LayoutContainmentProps {
    /** Maximum content width. Defaults to `wide`. */
    width?: PageWidth | undefined;
    /** Padding around the content. Defaults to `3xl`. */
    gutter?: LayoutSpace | undefined;
}
export interface StackOwnProps extends BaseProps, LayoutContainmentProps {
    /** Gap between children. Defaults to `2xl`. */
    space?: LayoutSpace | undefined;
    /** Cross-axis alignment. Defaults to `stretch`. */
    align?: LayoutAlign | undefined;
    /** Draw a decorative divider between children. */
    divided?: boolean | undefined;
}
export type StackProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, StackOwnProps>;
export interface ClusterOwnProps extends BaseProps, LayoutContainmentProps {
    /** Gap between children. Defaults to `md`. */
    space?: LayoutSpace | undefined;
    /** Cross-axis alignment. Defaults to `center`. */
    align?: LayoutAlign | undefined;
    /** Main-axis distribution. Defaults to `start`. */
    justify?: LayoutJustify | undefined;
    /** Whether children wrap onto new lines. Defaults to `wrap`. */
    wrap?: LayoutWrap | undefined;
    /** Flow inline with surrounding text instead of as a block. */
    inline?: boolean | undefined;
    /** Draw a decorative divider between children. */
    divided?: boolean | undefined;
}
export type ClusterProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, ClusterOwnProps>;
export interface GridOwnProps extends BaseProps, LayoutContainmentProps {
    /** Column template. Defaults to `2`. */
    columns?: GridColumns | undefined;
    /** Smallest column width for `columns="fit"`. Defaults to `sm`. */
    minColumnWidth?: GridMinColumnWidth | undefined;
    /** Gap between cells. Defaults to `2xl`. */
    space?: LayoutSpace | undefined;
    /** Cell alignment. Defaults to `stretch`. */
    align?: LayoutAlign | undefined;
    /** Padding inside the grid. Defaults to `none`. */
    gutter?: LayoutSpace | undefined;
}
export type GridProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, GridOwnProps>;
export type FlexRowProps = NativeProps<'div'> & BaseProps & LayoutContainmentProps;
export interface InlineFieldProps extends NativeProps<'label'>, BaseProps, LayoutContainmentProps {
    /** Gap between label and control. Defaults to `xs`. */
    space?: LayoutSpace | undefined;
    /** Cross-axis alignment. Defaults to `center`. */
    align?: LayoutAlign | undefined;
    /** Main-axis distribution. Defaults to `start`. */
    justify?: LayoutJustify | undefined;
    /** Whether the parts wrap. Defaults to `nowrap`. */
    wrap?: LayoutWrap | undefined;
    /** Flow inline with surrounding text instead of as a block. */
    inline?: boolean | undefined;
}
export interface StatusBarProps extends NativeProps<'footer'>, BaseProps, LayoutContainmentProps {
    /** Gap between items. Defaults to `xs`. */
    space?: LayoutSpace | undefined;
    /** Distribution of items. Defaults to `between`. */
    justify?: LayoutJustify | undefined;
    /** Whether items wrap. Defaults to `nowrap`. */
    wrap?: LayoutWrap | undefined;
}
/**
 * The `data-grow`, `data-fill` and `data-clip` hook values of containment props, each falling back
 * to the component's default: `grow` publishes nothing for `false`, `fill` and `clip` default off.
 */
export declare function resolveContainment({ grow, fill, clip }: LayoutContainmentProps, defaults?: LayoutContainmentProps): {
    grow: string | undefined;
    fill: boolean;
    clip: boolean;
};
/**
 * The grid hook values of a column template: the columns, the fit minimum (published only for
 * `fit`), the gap and the cell alignment.
 */
export declare function resolveGridLayout({ columns, minColumnWidth, space, align, }: Required<Pick<GridOwnProps, 'columns' | 'minColumnWidth' | 'space' | 'align'>>): {
    columns: GridColumns;
    minColumnWidth: GridMinColumnWidth | undefined;
    space: LayoutSpace;
    align: LayoutAlign;
};
/** A view that fills its host as a column: it grows, fills the block size and clips by default. */
export declare function View({ children, className, grow, fill, clip, ...rest }: ViewProps): import("react").JSX.Element;
/** A centred page column with a maximum width and a gutter. */
export declare function Page({ children, className, width, gutter, grow, fill, clip, ...rest }: PageProps): import("react").JSX.Element;
/** Children in a column with a gap. */
export declare function Stack<E extends LayoutElement = 'div'>({ as, children, className, space, align, divided, grow, fill, clip, ...rest }: StackProps<E>): ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
/** Children in a row that wraps, with a gap. */
export declare function Cluster<E extends LayoutElement = 'div'>({ as, children, className, space, align, justify, wrap, inline, divided, grow, fill, clip, ...rest }: ClusterProps<E>): ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
/** Children in a grid of columns with a gap. */
export declare function Grid<E extends LayoutElement = 'div'>({ as, children, className, columns, minColumnWidth, space, align, gutter, grow, fill, clip, ...rest }: GridProps<E>): ReactElement<unknown, string | import("react").JSXElementConstructor<any>>;
/** A full-bleed row whose children divide the remaining space; it grows by default. */
export declare function FlexRow({ children, className, grow, fill, clip, ...rest }: FlexRowProps): import("react").JSX.Element;
/** A `<label>` holding a caption and its control in one row. */
export declare function InlineField({ children, className, space, align, justify, wrap, inline, grow, fill, clip, ...rest }: InlineFieldProps): import("react").JSX.Element;
/**
 * A `<footer>` strip of status items along the bottom of a view. It is not a landmark (outside
 * sectioning content a `<footer>` would be the page's content information): a named bar is a group,
 * and a caller `role` wins.
 */
export declare function StatusBar({ children, className, space, justify, wrap, grow, fill, clip, ...rest }: StatusBarProps): import("react").JSX.Element;
//# sourceMappingURL=layout.d.ts.map