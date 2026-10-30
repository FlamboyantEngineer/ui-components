import { clamp } from '../../utils/clamp.js';
import type { ResizeKeyboardInput } from './resize-handle.js';

/** Arrow keys step this share of the extent; Shift+arrows step the fine share. */
export const RESIZE_KEYBOARD_STEP = 5;
export const RESIZE_KEYBOARD_FINE_STEP = 1;

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
