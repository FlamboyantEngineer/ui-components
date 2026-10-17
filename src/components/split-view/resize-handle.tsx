import {
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';

/** The direction of the separator bar itself (`aria-orientation`). */
export type ResizeHandleOrientation = 'horizontal' | 'vertical';
/** The pane whose size the handle's value reports, relative to the separator. */
export type ResizeHandleSizedPane = 'before' | 'after';

/** Arrow keys step this share of the extent; Shift+arrows step the fine share. */
export const RESIZE_KEYBOARD_STEP = 5;
export const RESIZE_KEYBOARD_FINE_STEP = 1;

export interface ResizeKeyboardInput {
  orientation: ResizeHandleOrientation;
  value: number;
  minValue: number;
  maxValue: number;
  /** Full length of the split in value units: 100 for percentages, pixels otherwise. */
  extent: number;
  sizedPane?: ResizeHandleSizedPane | undefined;
  direction?: 'ltr' | 'rtl' | undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  let towardEnd: boolean;
  if (orientation === 'vertical') {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return null;
    towardEnd = (event.key === 'ArrowRight') === (direction === 'ltr');
  } else {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return null;
    towardEnd = event.key === 'ArrowDown';
  }
  const grows = towardEnd === (sizedPane === 'before');
  return clamp(value + (grows ? step : -step), minValue, maxValue);
}

export interface ResizeHandleProps extends Omit<
  ComponentPropsWithRef<'div'>,
  | 'className'
  | 'style'
  | 'children'
  | 'role'
  | 'onChange'
  | 'aria-orientation'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
> {
  /** The direction of the bar: `vertical` between side-by-side panes, `horizontal` between stacked ones. */
  orientation: ResizeHandleOrientation;
  /** The size of the sized pane, in any unit. */
  value: number;
  minValue: number;
  maxValue: number;
  /** Full length of the split in value units; the keyboard steps a share of it. Defaults to 100. */
  extent?: number | undefined;
  /** Value units per pixel of pointer travel, read when a drag starts. Defaults to 1. */
  unitsPerPixel?: number | (() => number) | undefined;
  /** The pane `value` sizes. Defaults to the pane `before` the separator. */
  sizedPane?: ResizeHandleSizedPane | undefined;
  /** Each new value from a drag or a key. */
  onChange?: ((value: number) => void) | undefined;
  /** The value after a drag ends or a key step. */
  onChangeEnd?: ((value: number) => void) | undefined;
  /** Called when a pointer drag starts and ends. */
  onResizingChange?: ((isResizing: boolean) => void) | undefined;
  isDisabled?: boolean | undefined;
  className?: string | undefined;
}

const hooks = createHooks('resize-handle', ['grip', 'shield']);

interface Drag {
  pointerId: number;
  start: number;
  startValue: number;
  scale: number;
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
  unitsPerPixel = 1,
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
  const [isResizing, setResizing] = useState(false);
  const drag = useRef<Drag | null>(null);
  const latest = useRef(value);
  if (!drag.current) latest.current = value;

  const axisCoordinate = (event: PointerEvent) =>
    orientation === 'vertical' ? event.clientX : event.clientY;
  // Pointer travel toward the inline end (or down) grows the pane before the separator.
  const sign =
    (orientation === 'vertical' && direction === 'rtl' ? -1 : 1) *
    (sizedPane === 'before' ? 1 : -1);

  const changeResizing = (next: boolean) => {
    setResizing(next);
    onResizingChange?.(next);
  };

  const finish = (target: HTMLDivElement, pointerId: number) => {
    const active = drag.current;
    if (!active || active.pointerId !== pointerId) return;
    drag.current = null;
    if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
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

  const interactive = isDisabled
    ? {}
    : {
        tabIndex: 0,
        onPointerDown(event: PointerEvent<HTMLDivElement>) {
          onPointerDown?.(event);
          if (event.button !== 0 || event.isPrimary === false || drag.current) return;
          event.preventDefault();
          const scale = typeof unitsPerPixel === 'function' ? unitsPerPixel() : unitsPerPixel;
          drag.current = {
            pointerId: event.pointerId,
            start: axisCoordinate(event),
            startValue: value,
            scale,
          };
          latest.current = value;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          changeResizing(true);
        },
        onPointerMove(event: PointerEvent<HTMLDivElement>) {
          onPointerMove?.(event);
          move(event);
        },
        onPointerUp(event: PointerEvent<HTMLDivElement>) {
          onPointerUp?.(event);
          move(event);
          finish(event.currentTarget, event.pointerId);
        },
        onPointerCancel(event: PointerEvent<HTMLDivElement>) {
          onPointerCancel?.(event);
          finish(event.currentTarget, event.pointerId);
        },
        onLostPointerCapture(event: PointerEvent<HTMLDivElement>) {
          onLostPointerCapture?.(event);
          finish(event.currentTarget, event.pointerId);
        },
        onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const next = resolveResizeKeyboardValue(event, {
            orientation,
            value,
            minValue,
            maxValue,
            extent,
            sizedPane,
            direction,
          });
          if (next === null) return;
          event.preventDefault();
          latest.current = next;
          if (next !== value) onChange?.(next);
          onChangeEnd?.(next);
        },
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
          data: { orientation, resizing: isResizing, disabled: isDisabled },
        })}
      >
        <span {...hooks.slot('grip')} aria-hidden="true" />
      </div>
      {isResizing ? (
        <div
          {...hooks.slot('shield', { orientation })}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0 }}
        />
      ) : null}
    </>
  );
}
