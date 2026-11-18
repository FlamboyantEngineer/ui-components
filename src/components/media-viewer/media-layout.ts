// Which command a key press asks of a media viewer.

import { isEditableTarget } from '../../utils/is-editable-target.js';

/** What a key press asks of a media viewer, if anything. */
type MediaKeyCommand = 'previous' | 'next' | 'zoom-in' | 'zoom-out';

/** Keys that ask the same of a media viewer in either text direction. */
const fixedKeys: Readonly<Record<string, MediaKeyCommand>> = {
  PageUp: 'previous',
  PageDown: 'next',
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
};

/**
 * The command of a key press: Page Up and Page Down move to the previous or next item, and so do the
 * arrow keys (mirrored right to left) unless `isPanning`, when they scroll a zoomed image instead;
 * `+` and `-` zoom. Presses with a modifier, or inside an element that uses keys itself, ask nothing.
 */
export function resolveMediaKey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>,
  direction: 'ltr' | 'rtl',
  isPanning = false,
): MediaKeyCommand | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isEditableTarget(event.target, '[role="slider"]')) return null;
  const fixed = fixedKeys[event.key];
  if (fixed) return fixed;
  if (isPanning) return null;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (event.key === forward) return 'next';
  return event.key === backward ? 'previous' : null;
}
