import { useId, useState, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
import { usePersistentState, useUiStrings, type PersistCodec } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import {
  resolveContainment,
  type LayoutContainmentProps,
  type LayoutSpace,
} from '../layout/layout.js';
import { ResizeHandle } from './resize-handle.js';

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

/** One pane of a resizable split. Sizes are percentages of the split. */
export interface SplitViewPane {
  /** The pane element's id, named by the separator's `aria-controls`. Generated when omitted. */
  id?: string | undefined;
  /** The pane's smallest size. */
  minSize?: number | undefined;
  /** The pane's largest size. */
  maxSize?: number | undefined;
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
  /** The two panes and their size bounds. Passing panes makes the split resizable. */
  panes: readonly [SplitViewPane, SplitViewPane];
  /** The first pane's size in percent (controlled). */
  size?: number | undefined;
  /** The first pane's initial size in percent. Defaults to 50. */
  defaultSize?: number | undefined;
  /** Each new size of the first pane, during a drag and on each key step. */
  onSizeChange?: ((size: number) => void) | undefined;
  /** The first pane's size after a drag ends or a key step. */
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  /** Restores and saves the uncontrolled size through the provider storage under this key. */
  persistKey?: string | undefined;
  /** The separator's accessible name. Defaults to the provider's `resize` string. */
  separatorLabel?: string | undefined;
  /** The first and second pane's content. */
  children: readonly [ReactNode, ReactNode];
}

export type SplitViewProps = FixedSplitViewProps | ResizableSplitViewProps;

type SplitSizeOptions = Pick<
  ResizableSplitViewProps,
  'panes' | 'size' | 'defaultSize' | 'persistKey' | 'onSizeChange' | 'onSizeChangeEnd'
>;

const defaultMinSize = 10;
const defaultMaxSize = 90;

const sizeCodec: PersistCodec<number> = {
  parse(raw) {
    const size = Number.parseFloat(raw);
    if (!Number.isFinite(size)) throw new Error('Stored split size is not a number');
    return size;
  },
  stringify: (size) => String(size),
};

const hooks = createHooks('split-view', ['pane']);

function isResizable(props: SplitViewProps): props is ResizableSplitViewProps {
  return props.panes !== undefined;
}

/**
 * The first pane's size: the controlled `size`, else the live size during a drag, else the committed
 * size, which persists. Live sizes stay out of storage until the drag or key step ends.
 */
function useSplitSize({
  panes,
  size,
  defaultSize,
  persistKey,
  onSizeChange,
  onSizeChangeEnd,
}: SplitSizeOptions) {
  const { min, max } = resolveSplitBounds(panes);
  const controlled = size !== undefined;
  const [committed, setCommitted] = usePersistentState<number>(
    controlled ? undefined : persistKey,
    () => resolveInitialSplitSize(panes, defaultSize),
    sizeCodec,
  );
  const [live, setLive] = useState<number | null>(null);
  return {
    min,
    max,
    current: clamp(size ?? live ?? committed, min, max),
    onChange(next: number) {
      if (!controlled) setLive(next);
      onSizeChange?.(next);
    },
    onChangeEnd(next: number) {
      if (!controlled) {
        setCommitted(next);
        setLive(null);
      }
      onSizeChangeEnd?.(next);
    },
  };
}

function ResizableSplitView({
  children,
  className,
  orientation = 'horizontal',
  panes,
  size,
  defaultSize,
  onSizeChange,
  onSizeChangeEnd,
  persistKey,
  separatorLabel,
  grow,
  fill,
  clip,
  ref,
  ...rest
}: ResizableSplitViewProps) {
  const strings = useUiStrings();
  const generatedId = useId();
  const firstId = panes[0].id ?? `${generatedId}-first`;
  const secondId = panes[1].id ?? `${generatedId}-second`;
  const split = useSplitSize({
    panes,
    size,
    defaultSize,
    persistKey,
    onSizeChange,
    onSizeChangeEnd,
  });
  const [isResizing, setResizing] = useState(false);
  const [root, setRoot] = useForwardedRef(ref);
  const horizontal = orientation === 'horizontal';
  // Percentages resolve against the split's inner size.
  const getUnitsPerPixel = () => {
    const length = (horizontal ? root.current?.clientWidth : root.current?.clientHeight) ?? 0;
    return length > 0 ? 100 / length : 0;
  };
  const containment = resolveContainment({ grow, fill, clip }, { fill: true, clip: true });
  const data = { orientation, resizable: true, resizing: isResizing, ...containment };

  return (
    <div {...rest} ref={setRoot} {...hooks.root({ className, data })}>
      <div
        {...hooks.slot('pane', { pane: 'first' })}
        id={firstId}
        style={{ flexBasis: `${split.current}%` }}
      >
        {children[0]}
      </div>
      <ResizeHandle
        orientation={horizontal ? 'vertical' : 'horizontal'}
        value={split.current}
        minValue={split.min}
        maxValue={split.max}
        getUnitsPerPixel={getUnitsPerPixel}
        aria-label={separatorLabel ?? strings.resize}
        aria-controls={`${firstId} ${secondId}`}
        onResizingChange={setResizing}
        onChange={split.onChange}
        onChangeEnd={split.onChangeEnd}
      />
      <div {...hooks.slot('pane', { pane: 'second' })} id={secondId}>
        {children[1]}
      </div>
    </div>
  );
}

/** The first pane's size bounds, combining both panes' constraints. */
export function resolveSplitBounds(panes: readonly [SplitViewPane, SplitViewPane]): {
  min: number;
  max: number;
} {
  const [first, second] = panes;
  const lowest = Math.max(
    first.minSize ?? defaultMinSize,
    second.maxSize === undefined ? defaultMinSize : 100 - second.maxSize,
  );
  const highest = Math.min(
    first.maxSize ?? defaultMaxSize,
    second.minSize === undefined ? defaultMaxSize : 100 - second.minSize,
  );
  const min = clamp(lowest, 0, 100);
  const max = clamp(highest, 0, 100);
  return min <= max ? { min, max } : { min: max, max };
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
 * Two panes side by side or stacked. With `ratio` the stylesheet sizes fixed tracks; with `panes` a
 * window splitter between them resizes the first pane by pointer and keyboard.
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
