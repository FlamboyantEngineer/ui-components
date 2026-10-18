import { useEffect, useRef, type RefObject } from 'react';
import { resolveFocusTarget, type FocusTarget } from '../../utils/focus-target.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ModalFocusTarget = FocusTarget;

export interface InitialFocusProps {
  dialogRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  footerRef: RefObject<HTMLElement | null>;
  /** An element chosen by the caller, focused first when it resolves to one. */
  target?: ModalFocusTarget | undefined;
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
 * Moves focus on open to the caller's target, else to the first focusable element of the body, else
 * of the footer, else of the whole dialog. It renders inside the dialog so its effect runs before
 * the dialog focuses itself, and without a target it leaves focus alone when an element with
 * `autoFocus` took it.
 */
export function InitialFocus({ dialogRef, bodyRef, footerRef, target }: InitialFocusProps) {
  const targetRef = useRef(target);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const chosen = resolveFocusTarget(targetRef.current);
    if (chosen) {
      chosen.focus();
      return;
    }
    if (dialog.contains(document.activeElement)) return;
    const first =
      findFirstTabbable(bodyRef.current) ??
      findFirstTabbable(footerRef.current) ??
      findFirstTabbable(dialog);
    first?.focus();
  }, [dialogRef, bodyRef, footerRef]);
  return null;
}

export { useFocusReturn } from '../../utils/focus-target.js';
