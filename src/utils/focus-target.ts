'use client';

// Focus targets a caller names (`initialFocus`, `finalFocus`) and returning focus to one when a
// focus-managing container leaves the page. Shared by Modal and FocusScope.

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { isElement } from './is-element.js';
import { containsComposed, getComposedActiveElement, isFocusLost } from './composed-focus.js';

export {
  containsComposed,
  containsFocus,
  getComposedActiveElement,
  getDeepActiveElement,
  isFocused,
  isFocusLost,
} from './composed-focus.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type FocusTarget = RefObject<HTMLElement | null> | (() => HTMLElement | null | undefined);

interface FocusReturnOptions {
  /** The container whose removal returns focus. */
  containerRef: RefObject<HTMLElement | null>;
  /** The caller's choice of where focus goes when the container leaves the page. */
  finalFocus?: FocusTarget | undefined;
  /** Where focus goes when the caller chose nothing; `null` leaves it to React Aria. */
  fallback: Element | null;
}

/** Whether a value is an element that takes focus (an HTML or SVG element), from any window. */
export function isFocusableElement(value: unknown): value is HTMLElement {
  return isElement(value) && typeof (value as Partial<HTMLElement>).focus === 'function';
}

/** The element a focus target names now, if it is still in the document. */
export function resolveFocusTarget(target: FocusTarget | undefined): HTMLElement | null {
  const element = typeof target === 'function' ? target() : target?.current;
  return element?.isConnected ? element : null;
}

/**
 * When the container leaves the page, or the component closes a container that stays, moves focus
 * to `finalFocus`, else to `fallback`, provided focus was still inside the container, read through
 * open shadow roots, or on the body of the container's own document (a frame's, for a root mounted
 * in one), so a reader who moved elsewhere keeps their place. It runs while the container is removed, before React Aria's own
 * restoration, which then stands down.
 */
export function useFocusReturn({ containerRef, finalFocus, fallback }: FocusReturnOptions) {
  const optionsRef = useRef({ finalFocus, fallback });
  useLayoutEffect(() => {
    optionsRef.current = { finalFocus, fallback };
  });
  useLayoutEffect(() => {
    const container = containerRef.current;
    const owner = container?.ownerDocument ?? document;
    // The tree the container lives in, read before the container leaves it.
    const root = container?.getRootNode() ?? owner;
    return () => {
      const active = getComposedActiveElement(root);
      if (!isFocusLost(owner) && !(container && containsComposed(container, active))) return;
      // A frame keeps its focused element while the page around it holds focus; that is not ours.
      if (owner.defaultView?.frameElement && !owner.hasFocus()) return;
      const { finalFocus: chosen, fallback: opener } = optionsRef.current;
      const target =
        resolveFocusTarget(chosen) ??
        (isFocusableElement(opener) && opener.isConnected ? opener : null);
      if (!target) return;
      // A container that stays mounted (a retained dialog) is still in the document while React
      // commits, and React puts focus back on the element it had; move it once the commit is done.
      if (container?.isConnected) queueMicrotask(() => target.focus());
      else target.focus();
    };
  }, [containerRef]);
}
