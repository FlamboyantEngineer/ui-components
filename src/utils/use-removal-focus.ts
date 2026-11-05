'use client';

// Keeps keyboard focus in a list of removable items when the item whose remove button was pressed
// leaves the list. Shared by File Upload's listed files and Chat Attachment List.

import { useLayoutEffect, useRef } from 'react';
import type { Key } from '../core/props.js';
import {
  type FocusTarget,
  getComposedActiveElement,
  isFocusableElement,
  isFocusLost,
  resolveFocusTarget,
} from './focus-target.js';
import { toKeyIdentity } from './to-key-identity.js';

/** What the items' remove buttons report to the list that owns them. */
export interface RemovalFocus {
  /** Records an item's remove button, or its removal with `null`. */
  register: (id: Key, button: HTMLElement | null) => void;
  /** Records a press on an item's remove button, before the owner's remove callback runs. */
  willRemove: (id: Key) => void;
}

/** A removal waiting for the owner to drop the item: its id and the order of the items then. */
interface PendingRemoval {
  id: string;
  order: string[];
  /** The pressed button's tree: a frame's document or a shadow root, for a list mounted in one. */
  root: Node;
}

/** The item the focus moves to when `removed` leaves the list: the next one, else the previous one. */
function findNeighbour(order: readonly string[], removed: string, listed: ReadonlySet<string>) {
  const at = order.indexOf(removed);
  const next = order.slice(at + 1).find((id) => listed.has(id));
  return next ?? order.slice(0, at).findLast((id) => listed.has(id));
}

/** Whether focus fell to the page or still sits on a remove button that is leaving with the list. */
function isFocusLeaving(buttons: ReadonlyMap<string, HTMLElement>, root: Node): boolean {
  if (isFocusLost(root)) return true;
  const active = getComposedActiveElement(root);
  return isFocusableElement(active) && [...buttons.values()].includes(active);
}

/**
 * After the item of a pressed remove button leaves `items`, and the focus left with it, focuses the
 * next item's remove button, else the previous one's, else `fallback`, so a keyboard or screen
 * reader user keeps their place. A list that unmounts with the removal sends the focus to
 * `fallback` too.
 */
export function useRemovalFocus(
  items: readonly { id: Key }[],
  fallback: FocusTarget | undefined,
): RemovalFocus {
  const buttons = useRef(new Map<string, HTMLElement>());
  const removal = useRef<PendingRemoval | null>(null);
  const fallbackRef = useRef(fallback);
  useLayoutEffect(() => {
    fallbackRef.current = fallback;
  });
  useLayoutEffect(() => {
    const pending = removal.current;
    const listed = new Set(items.map((item) => toKeyIdentity(item.id)));
    if (!pending || listed.has(pending.id)) return;
    removal.current = null;
    if (!isFocusLost(pending.root)) return;
    const neighbour = findNeighbour(pending.order, pending.id, listed);
    const button = neighbour === undefined ? undefined : buttons.current.get(neighbour);
    (button ?? resolveFocusTarget(fallbackRef.current))?.focus();
  }, [items]);
  useLayoutEffect(() => {
    const registered = buttons.current;
    return () => {
      const pending = removal.current;
      if (pending && isFocusLeaving(registered, pending.root))
        resolveFocusTarget(fallbackRef.current)?.focus();
    };
  }, []);
  return {
    register(id, button) {
      if (button) buttons.current.set(toKeyIdentity(id), button);
      else buttons.current.delete(toKeyIdentity(id));
    },
    willRemove(id) {
      const identity = toKeyIdentity(id);
      removal.current = {
        id: identity,
        order: items.map((item) => toKeyIdentity(item.id)),
        root: buttons.current.get(identity)?.getRootNode() ?? document,
      };
    },
  };
}
