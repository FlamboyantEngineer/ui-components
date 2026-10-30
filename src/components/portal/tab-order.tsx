'use client';

// Keeps portalled content in the tab order of the place it is declared: Tab moves into and out of
// it as if it sat there, through focus guards in place and at both ends of the portal wrapper.

import { useMemo, useRef, type FocusEvent, type ReactNode, type RefObject } from 'react';
import { isTabbable, tabbableSelector } from '../../utils/tabbable.js';

type GuardKind = 'before' | 'after' | 'start' | 'end';

interface TabOrderNodes {
  wrapper: HTMLElement | null;
  guards: Record<GuardKind, HTMLElement | null>;
}

interface PreservedTabOrder {
  /** The ref for the portal wrapper. */
  wrapperRef: (node: HTMLDivElement | null) => void;
  /** The two guards rendered where the portal is declared. */
  placeGuards: ReactNode;
  /** The guard rendered first in the wrapper. */
  startGuard: ReactNode;
  /** The guard rendered last in the wrapper. */
  endGuard: ReactNode;
}

/** The tabbable elements of `root`'s document outside `nodes`, or inside the wrapper only. */
function listTabbables(nodes: TabOrderNodes, scope: 'inside' | 'outside'): HTMLElement[] {
  const { wrapper } = nodes;
  if (!wrapper) return [];
  const root = scope === 'inside' ? wrapper : wrapper.ownerDocument;
  const guards = new Set(Object.values(nodes.guards));
  return Array.from(root.querySelectorAll<HTMLElement>(tabbableSelector)).filter(
    (element) =>
      !guards.has(element) &&
      (scope === 'inside' || !wrapper.contains(element)) &&
      isTabbable(element),
  );
}

function isAfter(reference: Node, element: Node): boolean {
  return Boolean(reference.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/** The tabbable element outside the portal just after (or before) `reference` in document order. */
function findOutside(nodes: TabOrderNodes, reference: Node | null, direction: 'next' | 'previous') {
  if (!reference) return null;
  const outside = listTabbables(nodes, 'outside');
  return direction === 'next'
    ? (outside.find((element) => isAfter(reference, element)) ?? null)
    : (outside.findLast((element) => isAfter(element, reference)) ?? null);
}

/** Where focus goes from a guard; `null` leaves the page's tab order (the guard blurs). */
function resolveGuardTarget(kind: GuardKind, nodes: TabOrderNodes, cameFrom: Node | null) {
  const { wrapper, guards } = nodes;
  const inside = listTabbables(nodes, 'inside');
  const fromInside = cameFrom !== null && Boolean(wrapper?.contains(cameFrom));
  switch (kind) {
    case 'before':
      return inside[0] ?? findOutside(nodes, guards.after, 'next');
    case 'after':
      return inside.at(-1) ?? findOutside(nodes, guards.before, 'previous');
    case 'start':
      // Leaving backwards, or reached at the end of the document: skip what was already visited.
      return fromInside
        ? findOutside(nodes, guards.before, 'previous')
        : findOutside(nodes, guards.end, 'next');
    case 'end':
      return fromInside
        ? findOutside(nodes, guards.after, 'next')
        : findOutside(nodes, guards.start, 'previous');
  }
}

function FocusGuard({
  kind,
  nodes,
}: {
  kind: GuardKind;
  nodes: RefObject<TabOrderNodes>;
}): ReactNode {
  const onFocus = (event: FocusEvent<HTMLSpanElement>) => {
    const target = resolveGuardTarget(kind, nodes.current, event.relatedTarget);
    if (target) target.focus();
    else event.currentTarget.blur();
  };
  return (
    <span
      ref={(node) => {
        nodes.current.guards[kind] = node;
      }}
      tabIndex={0}
      style={{ position: 'fixed', top: 0, left: 0 }}
      onFocus={onFocus}
    />
  );
}

/**
 * Focus guards that give portalled content the tab order of the place it is declared. Tab reaches
 * the content right after what precedes that place and leaves it to what follows; Shift+Tab does
 * the reverse. Reached through the document's own order instead, the content is skipped.
 */
export function usePreservedTabOrder(): PreservedTabOrder {
  const nodes = useRef<TabOrderNodes>({
    wrapper: null,
    guards: { before: null, after: null, start: null, end: null },
  });
  return useMemo(
    () => ({
      wrapperRef: (node) => {
        nodes.current.wrapper = node;
      },
      placeGuards: (
        <>
          <FocusGuard kind="before" nodes={nodes} />
          <FocusGuard kind="after" nodes={nodes} />
        </>
      ),
      startGuard: <FocusGuard kind="start" nodes={nodes} />,
      endGuard: <FocusGuard kind="end" nodes={nodes} />,
    }),
    [],
  );
}
