import { createElement, type ComponentPropsWithRef, type JSX, type ReactElement } from 'react';
import { createHooks } from '../../core/hooks.js';

/** A closed scale of spacing steps, smallest to largest. The stylesheet maps each step to a length. */
export type LayoutSpace =
  | 'none'
  | '3xs'
  | '2xs'
  | 'xs'
  | 'compact'
  | 'sm'
  | 'sm-plus'
  | 'relaxed'
  | 'md'
  | 'lg';
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
export type GridMinColumnWidth = 'sm' | 'md' | 'lg' | 'xl';
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

interface HookedProps {
  /** Appended after the hook class. */
  className?: string | undefined;
}

type ElementProps<E extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithRef<E>,
  'className' | 'style'
>;

/** Own props plus the native props of the element chosen with `as`. */
export type PolymorphicLayoutProps<E extends LayoutElement, Own extends object> = Own & {
  /** The element to render. Defaults to `div`. */
  as?: E | undefined;
} & Omit<ComponentPropsWithRef<NoInfer<E>>, keyof Own | 'as' | 'className' | 'style'>;

/** The `data-grow` value for a growth option, or nothing for the default sizing. */
export function layoutGrowValue(
  grow: LayoutGrow | undefined,
  fallback: LayoutGrow,
): 'true' | 'auto' | 'none' | undefined {
  const value = grow ?? fallback;
  if (value === true) return 'true';
  if (value === false) return undefined;
  return value;
}

function containment(
  { grow, fill, clip }: LayoutContainmentProps,
  defaults: { grow?: LayoutGrow; fill?: boolean; clip?: boolean } = {},
) {
  return {
    grow: layoutGrowValue(grow, defaults.grow ?? false),
    fill: fill ?? defaults.fill ?? false,
    clip: clip ?? defaults.clip ?? false,
  };
}

function renderAs(
  element: LayoutElement,
  props: Record<string, unknown>,
  children: unknown,
): ReactElement {
  return createElement(element, props, children as never);
}

const viewHooks = createHooks('view');

export type ViewProps = ElementProps<'section'> & HookedProps & LayoutContainmentProps;

/** A view that fills its host as a column: it grows, fills the block size and clips by default. */
export function View({ children, className, grow, fill, clip, ...rest }: ViewProps) {
  return (
    <section
      {...rest}
      {...viewHooks.root({
        className,
        data: containment({ grow, fill, clip }, { grow: true, fill: true, clip: true }),
      })}
    >
      {children}
    </section>
  );
}

const pageHooks = createHooks('page');

export interface PageProps extends ElementProps<'section'>, HookedProps, LayoutContainmentProps {
  /** Maximum content width. Defaults to `wide`. */
  width?: PageWidth | undefined;
  /** Padding around the content. Defaults to `lg`. */
  gutter?: LayoutSpace | undefined;
}

/** A centred page column with a maximum width and a gutter. */
export function Page({
  children,
  className,
  width = 'wide',
  gutter = 'lg',
  grow,
  fill,
  clip,
  ...rest
}: PageProps) {
  return (
    <section
      {...rest}
      {...pageHooks.root({
        className,
        data: { width, gutter, ...containment({ grow, fill, clip }, { grow: true }) },
      })}
    >
      {children}
    </section>
  );
}

const stackHooks = createHooks('stack');

export interface StackOwnProps extends HookedProps, LayoutContainmentProps {
  /** Gap between children. Defaults to `md`. */
  space?: LayoutSpace | undefined;
  /** Cross-axis alignment. Defaults to `stretch`. */
  align?: LayoutAlign | undefined;
}

export type StackProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, StackOwnProps>;

/** Children in a column with a gap. */
export function Stack<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  space = 'md',
  align = 'stretch',
  grow,
  fill,
  clip,
  ...rest
}: StackProps<E>) {
  return renderAs(
    as ?? 'div',
    {
      ...rest,
      ...stackHooks.root({
        className,
        data: { space, align, ...containment({ grow, fill, clip }) },
      }),
    },
    children,
  );
}

const clusterHooks = createHooks('cluster');

export interface ClusterOwnProps extends HookedProps, LayoutContainmentProps {
  /** Gap between children. Defaults to `sm`. */
  space?: LayoutSpace | undefined;
  /** Cross-axis alignment. Defaults to `center`. */
  align?: LayoutAlign | undefined;
  /** Main-axis distribution. Defaults to `start`. */
  justify?: LayoutJustify | undefined;
  /** Whether children wrap onto new lines. Defaults to `wrap`. */
  wrap?: LayoutWrap | undefined;
  /** Flow inline with surrounding text instead of as a block. */
  inline?: boolean | undefined;
}

export type ClusterProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<
  E,
  ClusterOwnProps
>;

/** Children in a row that wraps, with a gap. */
export function Cluster<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  space = 'sm',
  align = 'center',
  justify = 'start',
  wrap = 'wrap',
  inline = false,
  grow,
  fill,
  clip,
  ...rest
}: ClusterProps<E>) {
  return renderAs(
    as ?? 'div',
    {
      ...rest,
      ...clusterHooks.root({
        className,
        data: { space, align, justify, wrap, inline, ...containment({ grow, fill, clip }) },
      }),
    },
    children,
  );
}

const gridHooks = createHooks('grid');

export interface GridOwnProps extends HookedProps, LayoutContainmentProps {
  /** Column template. Defaults to `2`. */
  columns?: GridColumns | undefined;
  /** Smallest column width for `columns="fit"`. Defaults to `sm`. */
  minColumnWidth?: GridMinColumnWidth | undefined;
  /** Gap between cells. Defaults to `md`. */
  space?: LayoutSpace | undefined;
  /** Cell alignment. Defaults to `stretch`. */
  align?: LayoutAlign | undefined;
  /** Padding inside the grid. Defaults to `none`. */
  gutter?: LayoutSpace | undefined;
}

export type GridProps<E extends LayoutElement = 'div'> = PolymorphicLayoutProps<E, GridOwnProps>;

/** Children in a grid of columns with a gap. */
export function Grid<E extends LayoutElement = 'div'>({
  as,
  children,
  className,
  columns = 2,
  minColumnWidth = 'sm',
  space = 'md',
  align = 'stretch',
  gutter = 'none',
  grow,
  fill,
  clip,
  ...rest
}: GridProps<E>) {
  return renderAs(
    as ?? 'div',
    {
      ...rest,
      ...gridHooks.root({
        className,
        data: {
          columns,
          minColumnWidth: columns === 'fit' ? minColumnWidth : undefined,
          space,
          align,
          gutter,
          ...containment({ grow, fill, clip }),
        },
      }),
    },
    children,
  );
}

const flexRowHooks = createHooks('flex-row');

export type FlexRowProps = ElementProps<'div'> & HookedProps & LayoutContainmentProps;

/** A full-bleed row whose children divide the remaining space; it grows by default. */
export function FlexRow({ children, className, grow, fill, clip, ...rest }: FlexRowProps) {
  return (
    <div
      {...rest}
      {...flexRowHooks.root({
        className,
        data: containment({ grow, fill, clip }, { grow: true }),
      })}
    >
      {children}
    </div>
  );
}

const inlineFieldHooks = createHooks('inline-field');

export interface InlineFieldProps
  extends ElementProps<'label'>, HookedProps, LayoutContainmentProps {
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
  return (
    <label
      {...rest}
      {...inlineFieldHooks.root({
        className,
        data: { space, align, justify, wrap, inline, ...containment({ grow, fill, clip }) },
      })}
    >
      {children}
    </label>
  );
}

const statusBarHooks = createHooks('status-bar');

export interface StatusBarProps
  extends ElementProps<'footer'>, HookedProps, LayoutContainmentProps {
  /** Gap between items. Defaults to `xs`. */
  space?: LayoutSpace | undefined;
  /** Distribution of items. Defaults to `between`. */
  justify?: LayoutJustify | undefined;
  /** Whether items wrap. Defaults to `nowrap`. */
  wrap?: LayoutWrap | undefined;
}

/** A `<footer>` band of status items along the bottom of a view. */
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
  return (
    <footer
      {...rest}
      {...statusBarHooks.root({
        className,
        data: { space, justify, wrap, ...containment({ grow, fill, clip }) },
      })}
    >
      {children}
    </footer>
  );
}

const contentsHooks = createHooks('contents');

export type ContentsProps = ElementProps<'div'> & HookedProps;

/**
 * A wrapper that adds no box of its own (`display: contents` in the stylesheet), for event capture,
 * portals and adapters. `hidden` removes its children from layout without unmounting them.
 */
export function Contents({ children, className, ...rest }: ContentsProps) {
  return (
    <div {...rest} {...contentsHooks.root({ className })}>
      {children}
    </div>
  );
}

const inlineContentsHooks = createHooks('inline-contents');

export type InlineContentsProps = ElementProps<'span'> & HookedProps;

/** The inline counterpart of `Contents`, valid inside phrasing content. */
export function InlineContents({ children, className, ...rest }: InlineContentsProps) {
  return (
    <span {...rest} {...inlineContentsHooks.root({ className })}>
      {children}
    </span>
  );
}

const embeddedFrameHooks = createHooks('embedded-frame');

export interface EmbeddedFrameProps
  extends Omit<ElementProps<'iframe'>, 'title'>, HookedProps, LayoutContainmentProps {
  /** The frame's accessible name. */
  title: string;
}

/**
 * An `<iframe>` that fills its host like `View`. It is fully sandboxed unless the caller grants
 * permissions through `sandbox`.
 */
export function EmbeddedFrame({
  className,
  sandbox,
  grow,
  fill,
  clip,
  ...rest
}: EmbeddedFrameProps) {
  return (
    <iframe
      {...rest}
      sandbox={sandbox ?? ''}
      {...embeddedFrameHooks.root({
        className,
        data: containment({ grow, fill, clip }, { grow: true, fill: true, clip: true }),
      })}
    />
  );
}
