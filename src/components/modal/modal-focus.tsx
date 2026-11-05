'use client';

import { type RefObject, useEffect, useRef } from 'react';
import {
  containsComposed,
  type FocusTarget,
  getComposedActiveElement,
  resolveFocusTarget,
} from '../../utils/focus-target.js';
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
    if (getComposedActiveElement(element) === element) return true;
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
      if (getComposedActiveElement(chosen) === chosen) return;
    }
    const active = getComposedActiveElement(dialog);
    if (active !== dialog && containsComposed(dialog, active)) return;
    if (focusFirstTabbable(bodyRef.current) || focusFirstTabbable(footerRef.current)) return;
    focusFirstTabbable(dialog);
  }, [dialogRef, bodyRef, footerRef]);
  return null;
}

export { useFocusReturn } from '../../utils/focus-target.js';
