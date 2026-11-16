'use client';

import { type FocusEvent, useEffect, useRef } from 'react';

/** Whether the element is a button that opens a menu or another popup. */
function isPopupButton(element: Element): boolean {
  const popup = element.getAttribute('aria-haspopup');
  if (popup === null || popup === 'false') return false;
  return element.tagName === 'BUTTON' || element.getAttribute('role') === 'button';
}

/**
 * Whether focus entering an entry makes its annotation active: focus on the entry or a control in
 * it, but not on a button that opens a menu or another popup (so a card's menu opens without the
 * card moving), and not inside a popup it rendered elsewhere in the document. A text box that
 * offers completions is not such a button: focus in it activates the entry.
 */
export function isActivatingFocus(event: FocusEvent<HTMLElement>): boolean {
  const target = event.target as Element;
  if (!event.currentTarget.contains(target)) return false;
  return target === event.currentTarget || !isPopupButton(target);
}

/**
 * Focus handlers for the margin that call `onLeave` once focus has left it, its popups included,
 * when `isEnabled`. Focus moving between two of its elements, or into a popup it rendered
 * elsewhere, reaches the margin's focus handler before the check runs.
 */
export function useLeaveFocus(isEnabled: boolean, onLeave: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    onFocus: () => clearTimeout(timer.current),
    onBlur: () => {
      if (!isEnabled) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(onLeave, 0);
    },
  };
}
