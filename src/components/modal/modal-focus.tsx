import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type ModalFocusTarget =
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null | undefined);

export interface InitialFocusProps {
  dialogRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  footerRef: RefObject<HTMLElement | null>;
  /** An element chosen by the caller, focused first when it resolves to one. */
  target?: ModalFocusTarget | undefined;
}

export interface FocusReturnOptions {
  dialogRef: RefObject<HTMLElement | null>;
  /** The caller's choice of where focus goes on close. */
  finalFocus?: ModalFocusTarget | undefined;
  /** Where focus goes when the caller chose nothing; `null` leaves it to React Aria. */
  fallback: Element | null;
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

/** The element a focus target names now, if it is still in the document. */
export function resolveFocusTarget(target: ModalFocusTarget | undefined): HTMLElement | null {
  const element = typeof target === 'function' ? target() : target?.current;
  return element?.isConnected ? element : null;
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

/**
 * When the dialog leaves the page, moves focus to `finalFocus`, else to `fallback`, provided focus
 * was still inside the dialog or on the body, so a reader who moved elsewhere keeps their place.
 * It runs while the dialog is removed, before React Aria's own restoration, which then stands down.
 */
export function useFocusReturn({ dialogRef, finalFocus, fallback }: FocusReturnOptions) {
  const optionsRef = useRef({ finalFocus, fallback });
  useLayoutEffect(() => {
    optionsRef.current = { finalFocus, fallback };
  });
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      const active = document.activeElement;
      if (active !== document.body && !dialog?.contains(active)) return;
      const { finalFocus: chosen, fallback: opener } = optionsRef.current;
      const target =
        resolveFocusTarget(chosen) ??
        (opener instanceof HTMLElement && opener.isConnected ? opener : null);
      target?.focus();
    };
  }, [dialogRef]);
}
