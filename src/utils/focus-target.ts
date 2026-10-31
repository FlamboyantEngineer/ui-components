'use client';

// Focus targets a caller names (`initialFocus`, `finalFocus`) and returning focus to one when a
// focus-managing container leaves the page. Shared by Modal and FocusScope.

import { useLayoutEffect, useRef, type RefObject } from 'react';

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

/**
 * Whether a value is an element that takes focus, from any window: `instanceof HTMLElement` holds
 * only for elements of the global window, not of a frame's document.
 */
export function isFocusableElement(value: unknown): value is HTMLElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Node).nodeType === 1 &&
    typeof (value as HTMLElement).focus === 'function'
  );
}

/**
 * The focused element, followed into same-origin frames: a document whose focus sits on a frame
 * reports the frame element, not the element inside it that holds focus.
 */
export function getDeepActiveElement(owner: Document = document): Element | null {
  let active = owner.activeElement;
  while (active?.tagName === 'IFRAME') {
    const inner = (active as HTMLIFrameElement).contentDocument?.activeElement;
    if (!inner) break;
    active = inner;
  }
  return active;
}

/**
 * The element holding focus in the tree `node` belongs to, followed into open shadow roots: a
 * document or shadow root whose focus sits inside a shadow host reports the host, not the element
 * inside it.
 */
export function getComposedActiveElement(node: Node): Element | null {
  const root = node.getRootNode() as Partial<DocumentOrShadowRoot>;
  let active = root.activeElement ?? null;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/** Whether `node` is `container` or inside it, also through the shadow roots of its hosts. */
export function containsComposed(container: Node, node: Node | null): boolean {
  let current = node;
  while (current) {
    if (current === container) return true;
    current = current.parentNode ?? (current as Partial<ShadowRoot>).host ?? null;
  }
  return false;
}

/** The element a focus target names now, if it is still in the document. */
export function resolveFocusTarget(target: FocusTarget | undefined): HTMLElement | null {
  const element = typeof target === 'function' ? target() : target?.current;
  return element?.isConnected ? element : null;
}

/**
 * When the container leaves the page, or the component closes a container that stays, moves focus
 * to `finalFocus`, else to `fallback`, provided focus was still inside the container or on the body
 * of the container's own document (a frame's, for a root mounted in one), so a reader who moved
 * elsewhere keeps their place. It runs while the container is removed, before React Aria's own
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
    return () => {
      const active = owner.activeElement;
      if (active !== owner.body && !container?.contains(active)) return;
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
