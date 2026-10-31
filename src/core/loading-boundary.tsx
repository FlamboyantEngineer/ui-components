'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

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
  return (
    <LoadingBoundaryContext.Provider value={value}>{children}</LoadingBoundaryContext.Provider>
  );
}

/** The loading boundary around the caller; outside any, content that is always available. */
export function useLoadingBoundary(): LoadingBoundary {
  return useContext(LoadingBoundaryContext);
}
