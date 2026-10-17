import {
  useCallback,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from 'react';
import { createHooks } from '../../core/hooks.js';
import { usePersistentState, useUiStrings, type PersistCodec } from '../../core/provider.js';
import {
  layoutGrowValue,
  type LayoutContainmentProps,
  type LayoutSpace,
} from '../layout/layout.js';
import { ResizeHandle } from './resize-handle.js';

export type SplitViewOrientation = 'horizontal' | 'vertical';
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
  minSize?: number | undefined;
  maxSize?: number | undefined;
}

type DivProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'style' | 'children'>;

interface SplitViewBaseProps extends DivProps, LayoutContainmentProps {
  /** `horizontal` (the default) puts the panes side by side; `vertical` stacks them. */
  orientation?: SplitViewOrientation | undefined;
  className?: string | undefined;
}

export interface FixedSplitViewProps extends SplitViewBaseProps {
  /** Track sizes. Defaults to `equal`. */
  ratio?: SplitViewRatio | undefined;
  /** Gap between the panes. Defaults to `none`. */
  space?: LayoutSpace | undefined;
  panes?: undefined;
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
  children: readonly [ReactNode, ReactNode];
}

export type SplitViewProps = FixedSplitViewProps | ResizableSplitViewProps;

const DEFAULT_MIN = 10;
const DEFAULT_MAX = 90;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The first pane's size bounds, combining both panes' constraints. */
export function resolveSplitBounds(panes: readonly [SplitViewPane, SplitViewPane]): {
  min: number;
  max: number;
} {
  const [first, second] = panes;
  const min = clamp(
    Math.max(
      first.minSize ?? DEFAULT_MIN,
      second.maxSize === undefined ? DEFAULT_MIN : 100 - second.maxSize,
    ),
    0,
    100,
  );
  const max = clamp(
    Math.min(
      first.maxSize ?? DEFAULT_MAX,
      second.minSize === undefined ? DEFAULT_MAX : 100 - second.minSize,
    ),
    0,
    100,
  );
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
    fill = true,
    clip = true,
    panes: _panes,
    ...rest
  } = props;
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        data: { orientation, ratio, space, grow: layoutGrowValue(grow, false), fill, clip },
      })}
    >
      {children}
    </div>
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
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
  fill = true,
  clip = true,
  ref,
  ...rest
}: ResizableSplitViewProps) {
  const strings = useUiStrings();
  const generatedId = useId();
  const firstId = panes[0].id ?? `${generatedId}-first`;
  const secondId = panes[1].id ?? `${generatedId}-second`;
  const { min, max } = resolveSplitBounds(panes);
  const controlled = size !== undefined;

  const [committed, setCommitted] = usePersistentState<number>(
    controlled ? undefined : persistKey,
    () => resolveInitialSplitSize(panes, defaultSize),
    sizeCodec,
  );
  const [live, setLive] = useState<number | null>(null);
  const [isResizing, setResizing] = useState(false);
  const current = clamp(size ?? live ?? committed, min, max);

  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  const horizontal = orientation === 'horizontal';
  // Percentages resolve against the split's inner size.
  const unitsPerPixel = () => {
    const element = root.current;
    const length = element ? (horizontal ? element.clientWidth : element.clientHeight) : 0;
    return length > 0 ? 100 / length : 0;
  };

  return (
    <div
      {...rest}
      ref={setRoot}
      {...hooks.root({
        className,
        data: {
          orientation,
          resizable: true,
          resizing: isResizing,
          grow: layoutGrowValue(grow, false),
          fill,
          clip,
        },
      })}
    >
      <div
        {...hooks.slot('pane', { pane: 'first' })}
        id={firstId}
        style={{ flexBasis: `${current}%` }}
      >
        {children[0]}
      </div>
      <ResizeHandle
        orientation={horizontal ? 'vertical' : 'horizontal'}
        value={current}
        minValue={min}
        maxValue={max}
        unitsPerPixel={unitsPerPixel}
        aria-label={separatorLabel ?? strings.resize}
        aria-controls={`${firstId} ${secondId}`}
        onResizingChange={setResizing}
        onChange={(next) => {
          // Live sizes are kept out of storage until the drag or key step ends.
          if (!controlled) setLive(next);
          onSizeChange?.(next);
        }}
        onChangeEnd={(next) => {
          if (!controlled) {
            setCommitted(next);
            setLive(null);
          }
          onSizeChangeEnd?.(next);
        }}
      />
      <div {...hooks.slot('pane', { pane: 'second' })} id={secondId}>
        {children[1]}
      </div>
    </div>
  );
}
