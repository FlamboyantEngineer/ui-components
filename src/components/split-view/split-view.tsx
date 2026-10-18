import type { ReactNode, Ref } from 'react';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import {
  resolveContainment,
  type LayoutContainmentProps,
  type LayoutSpace,
} from '../layout/layout.js';
import { ResizableSplitView } from './resizable-split-view.js';
import { resolveSplitSeparator, type SplitViewPane } from './split-layout.js';
import { splitViewHooks as hooks } from './styling-hooks.js';

// Other components reach the standalone handle through this main module.
export { ResizeHandle } from './resize-handle.js';

export type { SplitViewPane, SplitViewPaneUnit } from './split-layout.js';

/**
 * Fixed track sizes: `equal` halves, `main-sidebar` a flexible main track and a bounded sidebar,
 * `main-rail` a flexible main track and a fixed-width rail, `content-main` and `main-content` a track
 * sized to its content before or after a flexible one.
 */
export type SplitViewRatio =
  | 'equal'
  | 'main-sidebar'
  | 'main-rail'
  | 'content-main'
  | 'main-content';

/** Collapses, opens and resizes the panes of a resizable split. */
export interface SplitViewHandle {
  /** Collapses pane `index` if it is collapsible. */
  collapse: (index: number) => void;
  /** Opens collapsed pane `index` at the size it had before collapsing. */
  expand: (index: number) => void;
  /** Sets every pane's size in its unit, fitted to the bounds. */
  resize: (sizes: readonly number[]) => void;
}

interface SplitViewBaseProps
  extends Omit<NativeProps<'div'>, 'children'>, BaseProps, LayoutContainmentProps {
  /** `horizontal` (the default) puts the panes side by side; `vertical` stacks them. */
  orientation?: Orientation | undefined;
}

export interface FixedSplitViewProps extends SplitViewBaseProps {
  /** Track sizes. Defaults to `equal`. */
  ratio?: SplitViewRatio | undefined;
  /** Gap between the panes. Defaults to `none`. */
  space?: LayoutSpace | undefined;
  /** A fixed split takes no panes. */
  panes?: undefined;
  /** The panes' content, laid out on the fixed tracks. */
  children?: ReactNode;
}

export interface ResizableSplitViewProps extends SplitViewBaseProps {
  /** Two or more panes and their size bounds. Passing panes makes the split resizable. */
  panes: readonly SplitViewPane[];
  /** Every pane's size in its unit (controlled). */
  sizes?: readonly number[] | undefined;
  /** Every pane's initial size. Defaults to equal shares for percent panes. */
  defaultSizes?: readonly number[] | undefined;
  /** Every pane's new sizes, during a drag and on each key step. */
  onSizesChange?: ((sizes: number[]) => void) | undefined;
  /** Every pane's sizes after a drag, a key step, a collapse or a resize. */
  onSizesChangeEnd?: ((sizes: number[]) => void) | undefined;
  /** The first pane's size in percent (controlled), for two panes. */
  size?: number | undefined;
  /** The first pane's initial size in percent, for two panes. Defaults to 50. */
  defaultSize?: number | undefined;
  /** Each new size of the first pane, during a drag and on each key step. */
  onSizeChange?: ((size: number) => void) | undefined;
  /** The first pane's size after a drag ends or a key step. */
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  /** Restores and saves the uncontrolled sizes through the provider storage under this key. */
  persistKey?: string | undefined;
  /** The separators' accessible name, or one per separator by index. Defaults to `resize`. */
  separatorLabel?: string | ((index: number) => string) | undefined;
  /** Called with a pane's index when it collapses. */
  onCollapse?: ((index: number) => void) | undefined;
  /** Called with a pane's index when it opens after being collapsed. */
  onExpand?: ((index: number) => void) | undefined;
  /** Receives `collapse`, `expand` and `resize`. */
  handleRef?: Ref<SplitViewHandle> | undefined;
  /** Each pane's content, in pane order. */
  children: readonly ReactNode[];
}

export type SplitViewProps = FixedSplitViewProps | ResizableSplitViewProps;

function isResizable(props: SplitViewProps): props is ResizableSplitViewProps {
  return props.panes !== undefined;
}

/** The first of two percent panes' size bounds, combining both panes' constraints. */
export function resolveSplitBounds(panes: readonly [SplitViewPane, SplitViewPane]): {
  min: number;
  max: number;
} {
  const { min, max } = resolveSplitSeparator(panes, [50, 50], { index: 0, available: 0 });
  return { min, max };
}

/** The first pane's starting size: a stored size, else the default, else half, within the bounds. */
export function resolveInitialSplitSize(
  panes: readonly [SplitViewPane, SplitViewPane],
  defaultSize?: number | null,
  storedSize?: number | null,
): number {
  const { min, max } = resolveSplitBounds(panes);
  return clamp(storedSize ?? defaultSize ?? 50, min, max);
}

/**
 * Panes side by side or stacked. With `ratio` the stylesheet sizes two fixed tracks; with `panes`
 * a window splitter between each pair resizes them by pointer and keyboard, and collapsible panes
 * collapse and open again.
 */
export function SplitView(props: SplitViewProps) {
  if (isResizable(props)) return <ResizableSplitView {...props} />;
  const {
    children,
    className,
    orientation = 'horizontal',
    ratio = 'equal',
    space = 'none',
    grow,
    fill,
    clip,
    panes: _panes,
    ...rest
  } = props;
  const containment = resolveContainment({ grow, fill, clip }, { fill: true, clip: true });
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { orientation, ratio, space, ...containment } })}
    >
      {children}
    </div>
  );
}
