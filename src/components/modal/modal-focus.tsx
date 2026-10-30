'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { resolveFocusTarget, type FocusTarget } from '../../utils/focus-target.js';
import { listTabbables } from '../../utils/tabbable.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ModalFocusTarget = FocusTarget;

interface InitialFocusProps {
  dialogRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  footerRef: RefObject<HTMLElement | null>;
  /** An element chosen by the caller, focused first when it resolves to one. */
  target?: ModalFocusTarget | undefined;
}

function focusFirstTabbable(root: Element | null): boolean {
  if (!root) return false;
  for (const element of listTabbables(root)) {
    element.focus();
    if (element.ownerDocument.activeElement === element) return true;
  }
  return false;
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
      if (chosen.ownerDocument.activeElement === chosen) return;
    }
    const active = dialog.ownerDocument.activeElement;
    if (active !== dialog && dialog.contains(active)) return;
    if (focusFirstTabbable(bodyRef.current) || focusFirstTabbable(footerRef.current)) return;
    focusFirstTabbable(dialog);
  }, [dialogRef, bodyRef, footerRef]);
  return null;
}

export { useFocusReturn } from '../../utils/focus-target.js';
