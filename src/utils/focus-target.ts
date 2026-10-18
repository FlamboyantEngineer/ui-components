// Focus targets a caller names (`initialFocus`, `finalFocus`) and returning focus to one when a
// focus-managing container leaves the page. Shared by Modal and FocusScope.

import { useLayoutEffect, useRef, type RefObject } from 'react';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type FocusTarget = RefObject<HTMLElement | null> | (() => HTMLElement | null | undefined);

export interface FocusReturnOptions {
  /** The container whose removal returns focus. */
  containerRef: RefObject<HTMLElement | null>;
  /** The caller's choice of where focus goes when the container leaves the page. */
  finalFocus?: FocusTarget | undefined;
  /** Where focus goes when the caller chose nothing; `null` leaves it to React Aria. */
  fallback: Element | null;
}

/** The element a focus target names now, if it is still in the document. */
export function resolveFocusTarget(target: FocusTarget | undefined): HTMLElement | null {
  const element = typeof target === 'function' ? target() : target?.current;
  return element?.isConnected ? element : null;
}

/**
 * When the container leaves the page, moves focus to `finalFocus`, else to `fallback`, provided
 * focus was still inside the container or on the body, so a reader who moved elsewhere keeps their
 * place. It runs while the container is removed, before React Aria's own restoration, which then
 * stands down.
 */
export function useFocusReturn({ containerRef, finalFocus, fallback }: FocusReturnOptions) {
  const optionsRef = useRef({ finalFocus, fallback });
  useLayoutEffect(() => {
    optionsRef.current = { finalFocus, fallback };
  });
  useLayoutEffect(() => {
    const container = containerRef.current;
    return () => {
      const active = document.activeElement;
      if (active !== document.body && !container?.contains(active)) return;
      const { finalFocus: chosen, fallback: opener } = optionsRef.current;
      const target =
        resolveFocusTarget(chosen) ??
        (opener instanceof HTMLElement && opener.isConnected ? opener : null);
      target?.focus();
    };
  }, [containerRef]);
}
