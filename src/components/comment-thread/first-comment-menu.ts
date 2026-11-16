'use client';

import { createContext, useContext, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { Key } from '../../core/props.js';
import type { MenuEntry } from '../menu/menu.js';

/** The opening comment's menu as it hands it to the thread's header. */
export interface FirstCommentMenu {
  entries: readonly MenuEntry[];
  run: (key: Key) => void;
}

/** Where the opening comment publishes its menu, and the thread's header reads it. */
export interface FirstCommentMenuStore {
  get: () => FirstCommentMenu | null;
  set: (menu: FirstCommentMenu | null) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createFirstCommentMenuStore(): FirstCommentMenuStore {
  let menu: FirstCommentMenu | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => menu,
    set: (next) => {
      menu = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The store of a thread whose opening comment's menu moves to its header, around that comment. */
export const FirstCommentMenuContext = createContext<FirstCommentMenuStore | null>(null);

const noStore = () => () => {};
const noMenu = () => null;

/** The opening comment's menu, while the store holds one. */
export function useFirstCommentMenu(store: FirstCommentMenuStore | null): FirstCommentMenu | null {
  return useSyncExternalStore(store?.subscribe ?? noStore, store?.get ?? noMenu, noMenu);
}

/** What changes a menu as the reader sees it: its entries' ids and labels. */
function toSignature(entries: readonly MenuEntry[]): string {
  return entries
    .map((entry) => `${String(entry.id)}\u0000${'label' in entry ? entry.label : ''}`)
    .join('\u0001');
}

/**
 * Hands the comment's menu to its thread's header when the comment is the opening one of a thread
 * that asks for it. The menu is published again only when its entries change, and withdrawn when
 * it empties or the comment unmounts.
 */
export function usePublishedMenu(
  entries: readonly MenuEntry[],
  run: (key: Key) => void,
  isOffered: boolean,
): void {
  const store = useContext(FirstCommentMenuContext);
  const latest = useRef({ entries, run });
  useLayoutEffect(() => {
    latest.current = { entries, run };
  });
  const signature = isOffered ? toSignature(entries) : null;
  useLayoutEffect(() => {
    if (!store || signature === null) return undefined;
    store.set({ entries: latest.current.entries, run: (key) => latest.current.run(key) });
    return () => store.set(null);
  }, [store, signature]);
}
