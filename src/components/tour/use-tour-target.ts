'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import { getOwnerDocument } from '../../utils/owner-window.js';
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
 * popover and its focus scope stay mounted from step to step.
 */
export function useTourTarget(target: TourTarget | undefined, isOpen: boolean) {
  const [resolved, setResolved] = useState<{ element: Element | null } | null>(null);
  const container = usePortalContainer();
  useLayoutEffect(() => {
    if (!isOpen) return;
    const element = resolveTourTarget(target, getOwnerDocument(container));
    element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    setResolved({ element });
  }, [target, isOpen, container]);
  return { element: resolved?.element ?? null, isResolved: isOpen && resolved !== null };
}
