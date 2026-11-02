'use client';

import { measureScale } from '../../utils/element-scale.js';
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, ControlSize, Orientation } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { Portal } from '../portal/portal.js';
import { resolveResizeKeyboardValue } from './resize-keyboard.js';

/** The pane whose size the handle's value reports, relative to the separator. */
export type ResizeHandleSizedPane = 'before' | 'after';

export interface ResizeKeyboardInput {
  /** The direction of the separator bar itself. */
  orientation: Orientation;
  value: number;
  minValue: number;
  maxValue: number;
  /** Full length of the split in value units: 100 for percentages, pixels otherwise. */
  extent: number;
  sizedPane?: ResizeHandleSizedPane | undefined;
  direction?: 'ltr' | 'rtl' | undefined;
}

export interface ResizeHandleProps
  extends
    Omit<
      ContainerProps<'div'>,
      | 'children'
      | 'role'
      | 'onChange'
      | 'aria-orientation'
      | 'aria-valuenow'
      | 'aria-valuemin'
      | 'aria-valuemax'
    >,
    BaseProps {
  /** The direction of the bar: `vertical` between side-by-side panes, `horizontal` between stacked ones. */
  orientation: Orientation;
  /** The size of the sized pane, in any unit. */
  value: number;
  /** The smallest value. */
  minValue: number;
  /** The largest value. */
  maxValue: number;
  /** Full length of the split in value units; the keyboard steps a share of it. Defaults to 100. */
  extent?: number | undefined;
  /** Value units per pixel of pointer travel, read when a drag starts. Defaults to 1. */
  getUnitsPerPixel?: (() => number) | undefined;
  /** The pane `value` sizes. Defaults to the pane `before` the separator. */
  sizedPane?: ResizeHandleSizedPane | undefined;
  /** Each new value from a drag or a key. */
  onChange?: ((value: number) => void) | undefined;
  /** The value after a drag ends or a key step. */
  onChangeEnd?: ((value: number) => void) | undefined;
  /** Called when a pointer drag starts and ends. */
  onResizingChange?: ((isResizing: boolean) => void) | undefined;
  /**
   * A drag abandoned without an end: the handle unmounted, became disabled, or its `resetKey`,
   * orientation, sized pane or writing direction changed. A preview of the drag's values held
   * outside the handle should be dropped.
   */
  onChangeCancel?: (() => void) | undefined;
  /** Ignore pointer and keyboard input and leave the tab order. */
  isDisabled?: boolean | undefined;
  /** How thick the bar and its grip are drawn, published as `data-size`. Defaults to `md`. */
  size?: ControlSize | undefined;
  /**
   * A change abandons a drag in progress, as becoming disabled does, without disabling later
   * presses: for a value whose owner changed, such as a split restored from another key.
   */
  resetKey?: unknown;
}

interface Drag {
  start: number;
  startValue: number;
  scale: number;
}

type ResizeInteractionOptions = ResizeKeyboardInput &
  Pick<
    ResizeHandleProps,
    'onChange' | 'onChangeEnd' | 'onResizingChange' | 'onChangeCancel' | 'isDisabled' | 'resetKey'
  > & {
    getUnitsPerPixel: () => number;
  };

const hooks = createHooks('resize-handle', ['grip', 'shield']);

const oneUnitPerPixel = () => 1;

function chain<E>(first: ((event: E) => void) | undefined, second: (event: E) => void) {
  return (event: E) => {
    first?.(event);
    second(event);
  };
}

/** The nearest ancestor with a box: a `display: contents` wrapper has none to measure. */
function findLaidOutParent(handle: HTMLElement): HTMLElement {
  let parent = handle.parentElement;
  while (parent && parent.offsetWidth === 0 && parent.offsetHeight === 0) {
    parent = parent.parentElement;
  }
  return parent ?? handle;
}

/**
 * Pointer dragging with pointer capture, and key steps. The latest value lives in a ref between
 * renders so a drag reports its last value when it ends.
 */
function useResizeInteraction(options: ResizeInteractionOptions) {
  const { orientation, value, minValue, maxValue, getUnitsPerPixel, onChange, onChangeEnd } =
    options;
  const { sizedPane = 'before', direction = 'ltr', onResizingChange, onChangeCancel } = options;
  const [isResizing, setResizing] = useState(false);
  // Pointer travel toward the inline end (or down) grows the pane before the separator.
  const sign =
    (orientation === 'vertical' && direction === 'rtl' ? -1 : 1) *
    (sizedPane === 'before' ? 1 : -1);
  // A drag belongs to the axis and direction it began on, as well as to the caller's reset key.
  const geometry = `${orientation}:${sign}`;
  const resetKey = useMemo(
    () => ({ owner: options.resetKey, geometry }),
    [options.resetKey, geometry],
  );
  const latest = useRef(value);
  useLayoutEffect(() => {
    if (!isResizing) latest.current = value;
  }, [isResizing, value]);

  const axisCoordinate = (event: PointerEvent) =>
    orientation === 'vertical' ? event.clientX : event.clientY;
  const changeResizing = (next: boolean) => {
    setResizing(next);
    onResizingChange?.(next);
  };
  const move = (event: PointerEvent<HTMLDivElement>, active: Drag) => {
    if (active.scale <= 0) return;
    const delta = (axisCoordinate(event) - active.start) * active.scale * sign;
    const next = clamp(active.startValue + delta, minValue, maxValue);
    if (next === latest.current) return;
    latest.current = next;
    onChange?.(next);
  };
  const pointer = usePointerDrag<HTMLDivElement, Drag>({
    isDisabled: options.isDisabled,
    resetKey,
    cancelsOnUnmount: true,
    onCancel: () => {
      changeResizing(false);
      onChangeCancel?.();
    },
    onStart: (event) => {
      event.preventDefault();
      latest.current = value;
      changeResizing(true);
      // Pointer travel is in viewport pixels; a scaled ancestor makes them more or fewer than the
      // split's own pixels, so the travel is measured against the split the handle sits in.
      const split = measureScale(findLaidOutParent(event.currentTarget));
      const scale = getUnitsPerPixel() / (orientation === 'vertical' ? split.x : split.y);
      return { start: axisCoordinate(event), startValue: value, scale };
    },
    onMove: move,
    // The browser cancelling the gesture, or taking its capture, abandons it like a reset does.
    onEnd: (event, active, isCancelled) => {
      changeResizing(false);
      if (isCancelled) {
        onChangeCancel?.();
        return;
      }
      move(event, active);
      onChangeEnd?.(latest.current);
    },
  });
  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const next = resolveResizeKeyboardValue(event, options);
    if (next === null) return;
    event.preventDefault();
    if (next !== value) onChange?.(next);
    onChangeEnd?.(next);
  };
  return { isResizing, pointer, step };
}

/** The caller's own pointer and key handlers on a handle. */
type HandleEvents = Pick<
  ResizeHandleProps,
  | 'tabIndex'
  | 'onPointerDown'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
  | 'onLostPointerCapture'
  | 'onKeyDown'
>;

/**
 * An enabled handle's tab stop, the caller's own if given (`-1` keeps a pointer-only handle out of
 * the tab order), and handlers: the caller's handlers run before the handle's own.
 */
function chainHandleEvents(
  caller: HandleEvents,
  { pointer, step }: ReturnType<typeof useResizeInteraction>,
) {
  return {
    tabIndex: caller.tabIndex ?? 0,
    onPointerDown: chain(caller.onPointerDown, pointer.onPointerDown),
    onPointerMove: chain(caller.onPointerMove, pointer.onPointerMove),
    onPointerUp: chain(caller.onPointerUp, pointer.onPointerUp),
    onPointerCancel: chain(caller.onPointerCancel, pointer.onPointerCancel),
    onLostPointerCapture: chain(caller.onLostPointerCapture, pointer.onLostPointerCapture),
    onKeyDown: chain(caller.onKeyDown, step),
  };
}

/**
 * A focusable window splitter (`role="separator"`) that resizes the pane beside it by pointer drag,
 * with pointer capture, and by keyboard. While a drag is in progress it renders a viewport shield so
 * the stylesheet can keep the resize cursor everywhere.
 */
export function ResizeHandle({
  orientation,
  value,
  minValue,
  maxValue,
  extent = 100,
  getUnitsPerPixel = oneUnitPerPixel,
  sizedPane = 'before',
  onChange,
  onChangeEnd,
  onResizingChange,
  onChangeCancel,
  isDisabled = false,
  resetKey,
  size = 'md',
  className,
  ...rest
}: ResizeHandleProps) {
  const { direction } = useLocale();
  const interaction = useResizeInteraction({
    orientation,
    value,
    minValue,
    maxValue,
    extent,
    sizedPane,
    direction,
    getUnitsPerPixel,
    onChange,
    onChangeEnd,
    onResizingChange,
    onChangeCancel,
    isDisabled,
    resetKey,
  });
  // A disabled handle ignores pointer and keys itself; the caller's handlers in `rest` still run.
  const interactive = isDisabled ? {} : chainHandleEvents(rest, interaction);

  return (
    <>
      <div
        {...rest}
        {...interactive}
        role="separator"
        aria-orientation={orientation}
        aria-valuenow={Math.round(value)}
        aria-valuemin={Math.round(minValue)}
        aria-valuemax={Math.round(maxValue)}
        aria-disabled={isDisabled || undefined}
        {...hooks.root({
          className,
          data: { orientation, size, resizing: interaction.isResizing, disabled: isDisabled },
        })}
      >
        <span {...hooks.slot('grip')} aria-hidden="true" />
      </div>
      {interaction.isResizing ? (
        // On the highest layer, outside any transformed or filtered ancestor that would confine it.
        <Portal layer="toast">
          <div
            {...hooks.slot('shield', { orientation })}
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0 }}
          />
        </Portal>
      ) : null}
    </>
  );
}
