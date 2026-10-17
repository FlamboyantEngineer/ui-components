import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';

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
      NativeProps<'div'>,
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
  /** Ignore pointer and keyboard input and leave the tab order. */
  isDisabled?: boolean | undefined;
}

interface Drag {
  pointerId: number;
  start: number;
  startValue: number;
  scale: number;
}

type ResizeInteractionOptions = ResizeKeyboardInput &
  Pick<ResizeHandleProps, 'onChange' | 'onChangeEnd' | 'onResizingChange'> & {
    getUnitsPerPixel: () => number;
  };

/** Arrow keys step this share of the extent; Shift+arrows step the fine share. */
export const RESIZE_KEYBOARD_STEP = 5;
export const RESIZE_KEYBOARD_FINE_STEP = 1;

const hooks = createHooks('resize-handle', ['grip', 'shield']);

const oneUnitPerPixel = () => 1;

function chain<E>(first: ((event: E) => void) | undefined, second: (event: E) => void) {
  return (event: E) => {
    first?.(event);
    second(event);
  };
}

/**
 * Pointer dragging with pointer capture, and key steps. The latest value lives in a ref between
 * renders so a drag reports its last value when it ends.
 */
function useResizeInteraction(options: ResizeInteractionOptions) {
  const { orientation, value, minValue, maxValue, getUnitsPerPixel, onChange, onChangeEnd } =
    options;
  const { sizedPane = 'before', direction = 'ltr', onResizingChange } = options;
  const [isResizing, setResizing] = useState(false);
  const drag = useRef<Drag | null>(null);
  // Pointer travel toward the inline end (or down) grows the pane before the separator.
  const sign =
    (orientation === 'vertical' && direction === 'rtl' ? -1 : 1) *
    (sizedPane === 'before' ? 1 : -1);
  const latest = useRef(value);
  if (!drag.current) latest.current = value;

  const axisCoordinate = (event: PointerEvent) =>
    orientation === 'vertical' ? event.clientX : event.clientY;
  const changeResizing = (next: boolean) => {
    setResizing(next);
    onResizingChange?.(next);
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    changeResizing(false);
    onChangeEnd?.(latest.current);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId || active.scale <= 0) return;
    const delta = (axisCoordinate(event) - active.start) * active.scale * sign;
    const next = clamp(active.startValue + delta, minValue, maxValue);
    if (next === latest.current) return;
    latest.current = next;
    onChange?.(next);
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.isPrimary === false || drag.current) return;
    event.preventDefault();
    const { pointerId } = event;
    drag.current = {
      pointerId,
      start: axisCoordinate(event),
      startValue: value,
      scale: getUnitsPerPixel(),
    };
    latest.current = value;
    event.currentTarget.setPointerCapture?.(pointerId);
    changeResizing(true);
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    move(event);
    finish(event);
  };
  const step = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const next = resolveResizeKeyboardValue(event, options);
    if (next === null) return;
    event.preventDefault();
    if (next !== value) onChange?.(next);
    onChangeEnd?.(next);
  };
  return { isResizing, start, move, end, finish, step };
}

/**
 * The window-splitter keyboard contract: the arrow keys along the separator's axis move it by 5 % of
 * the extent, Shift+arrows by 1 %, Home and End jump to the smallest and largest value. Moving the
 * separator toward the inline end (or down) grows the pane before it. Returns the clamped next value,
 * or `null` for a key that does not resize.
 */
export function resolveResizeKeyboardValue(
  event: { key: string; shiftKey: boolean },
  {
    orientation,
    value,
    minValue,
    maxValue,
    extent,
    sizedPane = 'before',
    direction = 'ltr',
  }: ResizeKeyboardInput,
): number | null {
  if (event.key === 'Home') return minValue;
  if (event.key === 'End') return maxValue;
  const step = (extent * (event.shiftKey ? RESIZE_KEYBOARD_FINE_STEP : RESIZE_KEYBOARD_STEP)) / 100;
  const [backKey, forwardKey] =
    orientation === 'vertical' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
  if (event.key !== backKey && event.key !== forwardKey) return null;
  const forward = event.key === forwardKey;
  const towardEnd = orientation === 'vertical' && direction === 'rtl' ? !forward : forward;
  const grows = towardEnd === (sizedPane === 'before');
  return clamp(value + (grows ? step : -step), minValue, maxValue);
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
  isDisabled = false,
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onKeyDown,
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
  });
  const interactive = isDisabled
    ? {}
    : {
        tabIndex: 0,
        onPointerDown: chain(onPointerDown, interaction.start),
        onPointerMove: chain(onPointerMove, interaction.move),
        onPointerUp: chain(onPointerUp, interaction.end),
        onPointerCancel: chain(onPointerCancel, interaction.finish),
        onLostPointerCapture: chain(onLostPointerCapture, interaction.finish),
        onKeyDown: chain(onKeyDown, interaction.step),
      };

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
          data: { orientation, resizing: interaction.isResizing, disabled: isDisabled },
        })}
      >
        <span {...hooks.slot('grip')} aria-hidden="true" />
      </div>
      {interaction.isResizing ? (
        <div
          {...hooks.slot('shield', { orientation })}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0 }}
        />
      ) : null}
    </>
  );
}
