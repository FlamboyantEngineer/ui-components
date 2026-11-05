'use client';

// Keeps portalled content in the tab order of the place it is declared: Tab moves into and out of
// it as if it sat there, through focus guards in place and at both ends of the portal wrapper.

import { type FocusEvent, type ReactNode, type RefObject, useMemo, useRef } from 'react';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { isSameRadioGroup, listTabStops, type TabDirection } from '../../utils/tabbable.js';

type GuardKind = 'before' | 'after' | 'start' | 'end';

interface TabOrderNodes {
  wrapper: HTMLElement | null;
  guards: Record<GuardKind, HTMLElement | null>;
}

interface PreservedTabOrder {
  /** The ref for the portal wrapper. */
  wrapperRef: (node: HTMLDivElement | null) => (() => void) | undefined;
  /** The two guards rendered where the portal is declared. */
  placeGuards: ReactNode;
  /** The guard rendered first in the wrapper. */
  startGuard: ReactNode;
  /** The guard rendered last in the wrapper. */
  endGuard: ReactNode;
}

/** The mounted portals that preserve their tab order, which skip each other's content. */
const portals = new Set<TabOrderNodes>();

/** How many such portals each document holds, to listen for Tab while it holds any. */
const documents = new Map<Document, number>();

/** Undoes what the last Tab press took out of the tab order. */
let pendingRestore: Array<() => void> = [];

/** Puts guards and content back in the tab order once focus has moved, or at the next key. */
function restoreTabOrder() {
  const undo = pendingRestore;
  pendingRestore = [];
  for (const step of undo) step();
}

function isAfter(reference: Node, element: Node): boolean {
  return Boolean(reference.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/** The portal whose wrapper holds `node`, innermost first, if any. */
function findPortalOf(node: Node | null): TabOrderNodes | undefined {
  let found: TabOrderNodes | undefined;
  for (const portal of portals) {
    if (node && portal.wrapper?.contains(node) && !found?.wrapper?.contains(portal.wrapper)) {
      found = portal;
    }
  }
  return found;
}

function isEdgeGuard(element: Element): boolean {
  for (const { guards } of portals) {
    if (element === guards.start || element === guards.end) return true;
  }
  return false;
}

/**
 * The page's tab stops as seen from `anchor`: every stop of the document but the portal's own
 * guards, the wrapper-end guards of every portal, and the content of the portals that do not hold
 * the anchor, which their place guards stand for.
 */
function listPageStops(nodes: TabOrderNodes, anchor: Node | null): HTMLElement[] {
  const { wrapper, guards } = nodes;
  if (!wrapper) return [];
  return listTabStops(wrapper.ownerDocument).filter((element) => {
    if (element === guards.before || element === guards.after || isEdgeGuard(element)) {
      return false;
    }
    const portal = findPortalOf(element);
    return !portal?.wrapper || (anchor !== null && portal.wrapper.contains(anchor));
  });
}

/** The tab stops of a portal's content, a nested portal's place guards included. */
function listContentStops(nodes: TabOrderNodes): HTMLElement[] {
  if (!nodes.wrapper) return [];
  return listTabStops(nodes.wrapper).filter(
    (element) => element !== nodes.guards.start && element !== nodes.guards.end,
  );
}

/** The first of `stops` past `reference` in `direction`, if any. */
function findPast(stops: readonly HTMLElement[], reference: Node, direction: TabDirection) {
  return (
    (direction === 'forward'
      ? stops.find((element) => isAfter(reference, element))
      : stops.findLast((element) => isAfter(element, reference))) ?? null
  );
}

/** A search for the page's tab stop past one of the portal's guards. */
interface PageSearch {
  /** The guard the search starts past. */
  from: Node | null;
  /** Where the page is seen from: the portal's place, or where focus came from. */
  anchor: Node | null;
  direction: TabDirection;
}

/** The page's tab stop just after (or before) one of the portal's guards. */
function findPageStop(nodes: TabOrderNodes, { from, anchor, direction }: PageSearch) {
  return from ? findPast(listPageStops(nodes, anchor), from, direction) : null;
}

/**
 * The page's tab stop just after (or before) the portal's place. Past the end of the content of a
 * portal that the place sits in, the search goes on from that portal's own place.
 */
function findBesidePlace(nodes: TabOrderNodes, direction: TabDirection): HTMLElement | null {
  const { before, after } = nodes.guards;
  const from = direction === 'forward' ? after : before;
  const found = findPageStop(nodes, { from, anchor: before, direction });
  const enclosing = findPortalOf(before);
  if (!enclosing) return found;
  return found && enclosing.wrapper?.contains(found)
    ? found
    : findBesidePlace(enclosing, direction);
}

/** Where focus goes from a guard; `null` when the page's tab order ends there. */
function resolveGuardTarget(kind: GuardKind, nodes: TabOrderNodes, cameFrom: Node | null) {
  const fromInside = cameFrom !== null && Boolean(nodes.wrapper?.contains(cameFrom));
  switch (kind) {
    case 'before':
      return listContentStops(nodes)[0] ?? findBesidePlace(nodes, 'forward');
    case 'after':
      return listContentStops(nodes).at(-1) ?? findBesidePlace(nodes, 'backward');
    case 'start':
      // Leaving backwards; or reached in document order, past content visited at its place.
      return fromInside
        ? findBesidePlace(nodes, 'backward')
        : findPageStop(nodes, { from: nodes.guards.end, anchor: cameFrom, direction: 'forward' });
    case 'end':
      return fromInside
        ? findBesidePlace(nodes, 'forward')
        : findPageStop(nodes, {
            from: nodes.guards.start,
            anchor: cameFrom,
            direction: 'backward',
          });
  }
}

function findGuard(element: Element | undefined) {
  for (const nodes of portals) {
    for (const kind of Object.keys(nodes.guards) as GuardKind[]) {
      if (nodes.guards[kind] === element) return { nodes, kind };
    }
  }
  return undefined;
}

/** The stop the browser's Tab moves to from `active`: past it, and past its radio group. */
function findNativeNext(owner: Document, active: Element, direction: TabDirection) {
  const stops = listTabStops(owner).filter(
    (element) => element !== active && !isSameRadioGroup(element, active),
  );
  return findPast(stops, active, direction) ?? undefined;
}

/** Takes a portal's guards, and its content unless focus is inside, out of the tab order. */
function takeOutOfTabOrder(nodes: TabOrderNodes, active: Element) {
  for (const element of Object.values(nodes.guards)) {
    if (element?.tabIndex !== 0) continue;
    element.tabIndex = -1;
    pendingRestore.push(() => {
      element.tabIndex = 0;
    });
  }
  const { wrapper } = nodes;
  if (wrapper && !wrapper.contains(active) && !wrapper.hasAttribute('inert')) {
    wrapper.setAttribute('inert', '');
    pendingRestore.push(() => wrapper.removeAttribute('inert'));
  }
}

function isPlainTab(event: KeyboardEvent): boolean {
  return (
    event.key === 'Tab' &&
    !event.defaultPrevented &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  );
}

/**
 * Before Tab moves focus, takes out of the tab order, until focus lands again, the guards (and the
 * content) of every portal that Tab would reach next only to find the page's tab order ends there,
 * so that focus leaves the document as it would without the portal. A guard that ended the order
 * by blurring would leave the browser's starting point on it and skip the page's first stops when
 * focus comes back.
 */
function onTabKeyDown(event: KeyboardEvent) {
  restoreTabOrder();
  if (!isPlainTab(event)) return;
  const owner = getOwnerDocument(event.currentTarget as Node | null);
  // The page's tab sequence is walked from the document's own focused element, a shadow host for
  // focus inside one, as the browser's sequential navigation does.
  // eslint-disable-next-line no-restricted-syntax
  const active = owner.activeElement;
  if (!active || active === owner.body) return;
  const direction: TabDirection = event.shiftKey ? 'backward' : 'forward';
  for (;;) {
    const guard = findGuard(findNativeNext(owner, active, direction));
    if (!guard || resolveGuardTarget(guard.kind, guard.nodes, active)) return;
    takeOutOfTabOrder(guard.nodes, active);
  }
}

function register(nodes: TabOrderNodes, wrapper: HTMLElement) {
  portals.add(nodes);
  const owner = wrapper.ownerDocument;
  const count = documents.get(owner) ?? 0;
  if (count === 0) {
    owner.addEventListener('keydown', onTabKeyDown, true);
    // Focus arriving anywhere, back from outside the document included, ends the Tab press.
    owner.addEventListener('focusin', restoreTabOrder, true);
  }
  documents.set(owner, count + 1);
  return () => {
    portals.delete(nodes);
    const left = (documents.get(owner) ?? 1) - 1;
    if (left === 0) {
      documents.delete(owner);
      owner.removeEventListener('keydown', onTabKeyDown, true);
      owner.removeEventListener('focusin', restoreTabOrder, true);
    } else documents.set(owner, left);
  };
}

function FocusGuard({
  kind,
  nodesRef,
}: {
  kind: GuardKind;
  nodesRef: RefObject<TabOrderNodes>;
}): ReactNode {
  const onFocus = (event: FocusEvent<HTMLSpanElement>) => {
    const target = resolveGuardTarget(kind, nodesRef.current, event.relatedTarget);
    if (target) target.focus();
    else event.currentTarget.blur();
  };
  return (
    <span
      ref={(node) => {
        nodesRef.current.guards[kind] = node;
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
 * the reverse. Reached through the document's own order instead, the content is skipped, and at
 * the ends of the page's tab order focus leaves the document as it would without the portal.
 */
export function usePreservedTabOrder(): PreservedTabOrder {
  const nodes = useRef<TabOrderNodes>({
    wrapper: null,
    guards: { before: null, after: null, start: null, end: null },
  });
  return useMemo(
    () => ({
      wrapperRef: (node) => {
        if (!node) return undefined;
        nodes.current.wrapper = node;
        const unregister = register(nodes.current, node);
        return () => {
          unregister();
          nodes.current.wrapper = null;
        };
      },
      placeGuards: (
        <>
          <FocusGuard kind="before" nodesRef={nodes} />
          <FocusGuard kind="after" nodesRef={nodes} />
        </>
      ),
      startGuard: <FocusGuard kind="start" nodesRef={nodes} />,
      endGuard: <FocusGuard kind="end" nodesRef={nodes} />,
    }),
    [],
  );
}
