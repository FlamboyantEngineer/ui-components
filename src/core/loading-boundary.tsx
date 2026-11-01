'use client';

import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { containsComposed, getComposedActiveElement } from '../utils/composed-focus.js';
import { useLatest } from '../utils/use-latest.js';

/**
 * The loading state of the content around a component, published by `LoadingRegion` and `Skeleton`
 * so the library's overlays opened from that content, which render outside it in a portal, become
 * unavailable with it.
 */
export interface LoadingBoundary {
  /** Whether the content is unavailable: busy, inert and, for a skeleton, hidden. */
  isSuspended: boolean;
  /**
   * Keeps focus that sits outside the content, such as in an overlay about to close, on the
   * boundary, and returns it to `target` once the content is available again.
   */
  holdFocus: (target: HTMLElement | null) => void;
}

const available: LoadingBoundary = { isSuspended: false, holdFocus: () => {} };

const LoadingBoundaryContext = createContext<LoadingBoundary>(available);

interface LoadingBoundaryProviderProps extends LoadingBoundary {
  children: ReactNode;
}

/**
 * Publishes a loading boundary to its children. Inside a suspended boundary, the outer one stays in
 * charge: it suspends the content and holds focus whatever this one's state.
 */
export function LoadingBoundaryProvider({
  isSuspended,
  holdFocus,
  children,
}: LoadingBoundaryProviderProps) {
  const outer = useContext(LoadingBoundaryContext);
  const value = useMemo(
    () => (outer.isSuspended ? outer : isSuspended ? { isSuspended, holdFocus } : available),
    [outer, isSuspended, holdFocus],
  );
  return <LoadingBoundaryContext value={value}>{children}</LoadingBoundaryContext>;
}

/** The loading boundary around the caller; outside any, content that is always available. */
export function useLoadingBoundary(): LoadingBoundary {
  return useContext(LoadingBoundaryContext);
}

/**
 * Publishes an available boundary to a modal dialog's content: the dialog is its own place to work,
 * so overlays opened inside it stay usable while the content it was opened from is suspended.
 */
export function AvailableLoadingBoundary({ children }: { children: ReactNode }) {
  return <LoadingBoundaryContext value={available}>{children}</LoadingBoundaryContext>;
}

/**
 * For a modal dialog opened from content a loading boundary can suspend. When the dialog leaves
 * while that content is suspended and focus is still inside `getContainer()` (the dialog), hands
 * `getTarget()` (its return target, such as the opener) to the boundary, which keeps focus on its
 * root and returns it there once the content is available again. Call it in a component mounted
 * while the dialog shows, before the dialog's own focus return, which then finds focus moved and
 * stands down.
 */
export function useHoldFocusOnLeave(
  getContainer: () => Element | null,
  getTarget: () => HTMLElement | null,
): void {
  const boundary = useLoadingBoundary();
  const latest = useLatest({ boundary, getTarget });
  // The container as last committed: its ref is gone by the time the dialog's cleanup runs.
  const containerRef = useRef<Element | null>(null);
  useLayoutEffect(() => {
    containerRef.current = getContainer() ?? containerRef.current;
  });
  useLayoutEffect(
    () => () => {
      const current = latest.current;
      const container = containerRef.current;
      if (!current.boundary.isSuspended || !container) return;
      if (!containsComposed(container, getComposedActiveElement(container))) return;
      current.boundary.holdFocus(current.getTarget());
    },
    [latest],
  );
}
