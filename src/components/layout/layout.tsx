import { createElement, type ComponentPropsWithRef, type ReactElement } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { interleaveDividers } from './dividers.js';

// Other components reach the toolbar row through this main module.
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
export type LayoutElement =
  | 'a'
  | 'article'
  | 'aside'
  | 'div'
  | 'dd'
  | 'dl'
  | 'dt'
  | 'fieldset'
  | 'figure'
  | 'footer'
  | 'form'
  | 'header'
  | 'label'
  | 'li'
  | 'main'
  | 'nav'
  | 'ol'
  | 'p'
  | 'section'
  | 'span'
  | 'ul';

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

export type ClusterProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<
  E,
  ClusterOwnProps
>;

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

const viewHooks = createHooks('view');
const pageHooks = createHooks('page');
const stackHooks = createHooks('stack', ['divider']);
const clusterHooks = createHooks('cluster', ['divider']);
const gridHooks = createHooks('grid');
const flexRowHooks = createHooks('flex-row');
const inlineFieldHooks = createHooks('inline-field');
const statusBarHooks = createHooks('status-bar');

function renderAs(
  element: LayoutElement,
  props: Record<string, unknown>,
  children: unknown,
): ReactElement {
  return createElement(element, props, children as never);
}

/**
 * The `data-grow`, `data-fill` and `data-clip` hook values of containment props, each falling back
 * to the component's default: `grow` publishes nothing for `false`, `fill` and `clip` default off.
 */
export function resolveContainment(
  { grow, fill, clip }: LayoutContainmentProps,
  defaults: LayoutContainmentProps = {},
) {
  const growth = grow ?? defaults.grow ?? false;
  return {
    grow: growth === true ? 'true' : growth || undefined,
    fill: fill ?? defaults.fill ?? false,
    clip: clip ?? defaults.clip ?? false,
  };
}

/**
 * The grid hook values of a column template: the columns, the fit minimum (published only for
 * `fit`), the gap and the cell alignment.
 */
export function resolveGridLayout({
  columns,
  minColumnWidth,
  space,
  align,
}: Required<Pick<GridOwnProps, 'columns' | 'minColumnWidth' | 'space' | 'align'>>) {
  return {
    columns,
    minColumnWidth: columns === 'fit' ? minColumnWidth : undefined,
    space,
    align,
  };
}

/** A view that fills its host as a column: it grows, fills the block size and clips by default. */
export function View({ children, className, grow, fill, clip, ...rest }: ViewProps) {
  const data = resolveContainment({ grow, fill, clip }, { grow: true, fill: true, clip: true });
  return (
    <section {...rest} {...viewHooks.root({ className, data })}>
      {children}
    </section>
  );
}

/** A centred page column with a maximum width and a gutter. */
export function Page({
  children,
  className,
  width = 'wide',
  gutter = '3xl',
  grow,
  fill,
  clip,
  ...rest
}: PageProps) {
  const data = { width, gutter, ...resolveContainment({ grow, fill, clip }, { grow: true }) };
  return (
    <section {...rest} {...pageHooks.root({ className, data })}>
      {children}
    </section>
  );
}

/** Children in a column with a gap. */
export function Stack<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  space = '2xl',
  align = 'stretch',
  divided = false,
  grow,
  fill,
  clip,
  ...rest
}: StackProps<E>) {
  const element = as ?? 'div';
  const data = { space, align, divided, ...resolveContainment({ grow, fill, clip }) };
  const content = divided
    ? interleaveDividers(children, { parent: element, className: stackHooks.slotClass('divider') })
    : children;
  return renderAs(element, { ...rest, ...stackHooks.root({ className, data }) }, content);
}

/** Children in a row that wraps, with a gap. */
export function Cluster<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  space = 'md',
  align = 'center',
  justify = 'start',
  wrap = 'wrap',
  inline = false,
  divided = false,
  grow,
  fill,
  clip,
  ...rest
}: ClusterProps<E>) {
  const element = as ?? 'div';
  const containment = resolveContainment({ grow, fill, clip });
  const data = { space, align, justify, wrap, inline, divided, ...containment };
  const content = divided
    ? interleaveDividers(children, {
        parent: element,
        className: clusterHooks.slotClass('divider'),
      })
    : children;
  return renderAs(element, { ...rest, ...clusterHooks.root({ className, data }) }, content);
}

/** Children in a grid of columns with a gap. */
export function Grid<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  columns = 2,
  minColumnWidth = 'sm',
  space = '2xl',
  align = 'stretch',
  gutter = 'none',
  grow,
  fill,
  clip,
  ...rest
}: GridProps<E>) {
  const data = {
    ...resolveGridLayout({ columns, minColumnWidth, space, align }),
    gutter,
    ...resolveContainment({ grow, fill, clip }),
  };
  return renderAs(as ?? 'div', { ...rest, ...gridHooks.root({ className, data }) }, children);
}

/** A full-bleed row whose children divide the remaining space; it grows by default. */
export function FlexRow({ children, className, grow, fill, clip, ...rest }: FlexRowProps) {
  const data = resolveContainment({ grow, fill, clip }, { grow: true });
  return (
    <div {...rest} {...flexRowHooks.root({ className, data })}>
      {children}
    </div>
  );
}

/** A `<label>` holding a caption and its control in one row. */
export function InlineField({
  children,
  className,
  space = 'xs',
  align = 'center',
  justify = 'start',
  wrap = 'nowrap',
  inline = false,
  grow,
  fill,
  clip,
  ...rest
}: InlineFieldProps) {
  const data = { space, align, justify, wrap, inline, ...resolveContainment({ grow, fill, clip }) };
  return (
    <label {...rest} {...inlineFieldHooks.root({ className, data })}>
      {children}
    </label>
  );
}

/**
 * A `<footer>` strip of status items along the bottom of a view. It is not a landmark (outside
 * sectioning content a `<footer>` would be the page's content information): a named bar is a group,
 * and a caller `role` wins.
 */
export function StatusBar({
  children,
  className,
  space = 'xs',
  justify = 'between',
  wrap = 'nowrap',
  grow,
  fill,
  clip,
  ...rest
}: StatusBarProps) {
  const data = { space, justify, wrap, ...resolveContainment({ grow, fill, clip }) };
  const isNamed = Boolean(rest['aria-label'] ?? rest['aria-labelledby']);
  return (
    <footer
      role={isNamed ? 'group' : 'none'}
      {...rest}
      {...statusBarHooks.root({ className, data })}
    >
      {children}
    </footer>
  );
}
