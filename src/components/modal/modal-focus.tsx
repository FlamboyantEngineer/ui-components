import { useEffect, type RefObject } from 'react';

export interface InitialFocusProps {
  dialogRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  footerRef: RefObject<HTMLElement | null>;
}

const tabbableSelector =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]';

function findFirstTabbable(root: Element | null): HTMLElement | null {
  if (!root) return null;
  for (const element of root.querySelectorAll<HTMLElement>(tabbableSelector)) {
    if (element.tabIndex < 0 || element.closest('[inert], [hidden]')) continue;
    if ('disabled' in element && element.disabled === true) continue;
    if (element instanceof HTMLInputElement && element.type === 'hidden') continue;
    return element;
  }
  return null;
}

/**
 * Moves focus on open to the first focusable element of the body, else of the footer, else of the
 * whole dialog. It renders inside the dialog so its effect runs before the dialog focuses itself,
 * and it leaves focus alone when an element with `autoFocus` took it.
 */
export function InitialFocus({ dialogRef, bodyRef, footerRef }: InitialFocusProps) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.contains(document.activeElement)) return;
    const target =
      findFirstTabbable(bodyRef.current) ??
      findFirstTabbable(footerRef.current) ??
      findFirstTabbable(dialog);
    target?.focus();
  }, [dialogRef, bodyRef, footerRef]);
  return null;
}
