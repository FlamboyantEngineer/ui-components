'use client';

import { type RefObject, useEffect, useRef } from 'react';
import {
  containsComposed,
  type FocusTarget,
  getComposedActiveElement,
  resolveFocusTarget,
} from '../../utils/focus-target.js';
import { listTabbables } from '../../utils/tabbable.js';
import { dialogHooks as hooks } from './dialog-hooks.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type DialogFocusTarget = FocusTarget;

interface InitialFocusProps {
  dialogRef: RefObject<HTMLElement | null>;
  /** An element chosen by the caller, focused first when it resolves to one. */
  target?: DialogFocusTarget | undefined;
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
export function InitialFocus({ dialogRef, target }: InitialFocusProps) {
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
    const body = dialog.querySelector(`.${hooks.slotClass('body')}`);
    const footer = dialog.querySelector(`.${hooks.slotClass('footer')}`);
    if (focusFirstTabbable(body) || focusFirstTabbable(footer)) return;
    focusFirstTabbable(dialog);
  }, [dialogRef]);
  return null;
}

export { useFocusReturn } from '../../utils/focus-target.js';
