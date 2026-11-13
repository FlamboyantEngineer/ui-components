'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePortalContainer } from '../portal/portal.js';

/** The element a step points at: a ref, or a CSS selector looked up when the step shows. */
export type TourTarget = RefObject<Element | null> | string;

/**
 * The target's element, or null when the ref is empty or no element matches the selector, which
 * is looked up in `owner`, the document the tour renders in.
 */
export function resolveTourTarget(
  target: TourTarget | undefined,
  owner: ParentNode = getOwnerDocument(null),
): Element | null {
  if (target === undefined) return null;
  if (typeof target !== 'string') return target.current;
  try {
    return owner.querySelector(target);
  } catch {
    // An invalid selector points at nothing.
    return null;
  }
}

/**
 * Looks up the shown step's target once the tour has rendered, and scrolls it into view. Until the
 * first lookup is done, `isResolved` is false, so the popover does not open at a stale place; on a
 * step change the previous target stands in until the lookup, before the page paints, so the
 * popover and its focus scope stay mounted from step to step. While open, the target is looked up
 * again after every commit and whenever nodes come or go in the document, so an element that
 * replaces it takes over and a removed one leaves the step without a target.
 */
export function useTourTarget(target: TourTarget | undefined, isOpen: boolean) {
  const [resolved, setResolved] = useState<{ element: Element | null } | null>(null);
  const container = usePortalContainer();
  const lookUp = useLatest(() => resolveTourTarget(target, getOwnerDocument(container)));
  useLayoutEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The target is looked up in the committed document.
    setResolved({ element: lookUp.current() });
  }, [target, isOpen, container, lookUp]);
  // Each element the step comes to target scrolls into view, a late one too once it appears.
  const element = resolved?.element ?? null;
  useLayoutEffect(() => {
    if (isOpen) element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [element, isOpen]);
  const follow = useLatest(() =>
    setResolved((current) => {
      const element = lookUp.current();
      return current === null || current.element === element ? current : { element };
    }),
  );
  // A ref's element changes in commits that change no prop.
  useLayoutEffect(() => {
    if (isOpen) follow.current();
  });
  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const document = getOwnerDocument(container);
    const view = document.defaultView;
    if (typeof view?.MutationObserver !== 'function') return undefined;
    const observer = new view.MutationObserver(() => follow.current());
    observer.observe(document, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isOpen, container, follow]);
  return { element: resolved?.element ?? null, isResolved: isOpen && resolved !== null };
}
