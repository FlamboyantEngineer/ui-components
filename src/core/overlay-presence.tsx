'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

/**
 * Which interactive overlays are open: menus and submenus, field popups (select, combobox,
 * completion, calendar, color, emoji) and popovers. Tooltips, hover cards and toasts never count.
 * Read it synchronously, for example before running a global shortcut, or subscribe to changes.
 */
export interface OverlayPresence {
  /** Whether at least one interactive overlay is open. */
  isActive(): boolean;
  /** How many interactive overlays are open; nested ones count separately. */
  getCount(): number;
  /**
   * Calls `listener` after the count changes, once per batch of changes made together, so a menu
   * that replaces another in one update reports no gap. Returns the function that unsubscribes.
   */
  subscribe(listener: () => void): () => void;
}

/** The store behind `OverlayPresence`, which the library's overlays register with. */
interface OverlayPresenceStore extends OverlayPresence {
  /**
   * Counts the overlay `token` names as open until the returned function is called; calling it
   * again does nothing. Registrations that share a token count once, until the last is released.
   */
  register(token: object): () => void;
}

export function createOverlayPresenceStore(): OverlayPresenceStore {
  const open = new Map<object, number>();
  const listeners = new Set<() => void>();
  let notified = 0;
  let isScheduled = false;
  const flush = () => {
    isScheduled = false;
    if (open.size === notified) return;
    notified = open.size;
    for (const listener of [...listeners]) listener();
  };
  const schedule = () => {
    if (isScheduled) return;
    isScheduled = true;
    queueMicrotask(flush);
  };
  return {
    isActive: () => open.size > 0,
    getCount: () => open.size,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register(token) {
      open.set(token, (open.get(token) ?? 0) + 1);
      schedule();
      let isReleased = false;
      return () => {
        if (isReleased) return;
        isReleased = true;
        const holders = (open.get(token) ?? 1) - 1;
        if (holders > 0) open.set(token, holders);
        else open.delete(token);
        schedule();
      };
    },
  };
}

/** Shared by every component outside a `UiProvider`. */
const defaultStore = createOverlayPresenceStore();

const OverlayPresenceContext = createContext<OverlayPresenceStore>(defaultStore);

/**
 * Gives the components below the outermost `UiProvider` a store of their own; a nested provider
 * shares its parent's, so one store covers a whole provider tree, portals included.
 */
export function OverlayPresenceScope({ children }: { children?: ReactNode }) {
  const parent = useContext(OverlayPresenceContext);
  const [store] = useState(() => (parent === defaultStore ? createOverlayPresenceStore() : parent));
  return <OverlayPresenceContext value={store}>{children}</OverlayPresenceContext>;
}

/**
 * Counts the overlay `token` names (such as its open state) as open while `isOpen` and mounted.
 * Copies of one overlay, such as React Aria renders to build a collection, share the token.
 */
export function useOverlayRegistration(isOpen: boolean, token: object): void {
  const store = useContext(OverlayPresenceContext);
  useLayoutEffect(() => (isOpen ? store.register(token) : undefined), [isOpen, store, token]);
}

/**
 * The interactive overlays open under the nearest `UiProvider` tree (or, without one, under every
 * component outside a provider), for code that reads it outside rendering, such as a shortcut
 * handler. The object is the same for the provider's lifetime.
 */
export function useOverlayPresence(): OverlayPresence {
  const { isActive, getCount, subscribe } = useContext(OverlayPresenceContext);
  return useMemo(() => ({ isActive, getCount, subscribe }), [isActive, getCount, subscribe]);
}

/** Whether an interactive overlay is open under the nearest `UiProvider` tree; re-renders on change. */
export function useIsOverlayActive(): boolean {
  const store = useContext(OverlayPresenceContext);
  return useSyncExternalStore(store.subscribe, store.isActive, () => false);
}
