/**
 * The event React Aria's focus scopes send to an element before they return focus to it, as a
 * closing menu or popover does to its trigger. React Aria's collections cancel it to focus their
 * row or cell instead.
 */
export const focusRestoreEvent = 'react-aria-focus-scope-restore';

/**
 * A ref callback for a collection row, or the part of one that holds controls: a menu or popover a
 * control inside it opened returns focus to that control when it closes, rather than to the row.
 * The collection never hears of that return, which it would otherwise take over; a return to the
 * element itself, such as to a row that opened a dialog, still reaches it.
 */
export function keepControlFocusReturn(element: HTMLElement | null): (() => void) | undefined {
  if (!element) return undefined;
  const keep = (event: Event) => {
    if (event.target !== element) event.stopPropagation();
  };
  element.addEventListener(focusRestoreEvent, keep);
  return () => element.removeEventListener(focusRestoreEvent, keep);
}
