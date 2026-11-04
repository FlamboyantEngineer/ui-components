'use client';

import {
  createContext,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { clamp } from '../../utils/clamp.js';
import { isFocusLost } from '../../utils/focus-target.js';
import { isNode } from '../../utils/is-element.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import type { ListHandle } from './list-row.js';

interface ListNavigationOptions {
  /** The class of the rows' primary controls, the elements navigation moves between. */
  primaryClass: string;
  /** Called on ArrowUp from the first row. */
  onNavigatePastStart?: (() => void) | undefined;
  /** Receives `focusFirst()`. */
  handleRef?: Ref<ListHandle> | undefined;
  /** The caller's ref to the `<ul>`. */
  ref?: Ref<HTMLUListElement> | undefined;
}

/** How rows join a list's single tab stop. */
interface RowRegistry {
  register(id: string, node: HTMLElement): () => void;
  subscribe(id: string, listener: () => void): () => void;
  getActiveId(): string | null;
  activate(id: string): void;
}

/** What a list puts on its `<ul>` and gives its rows. */
interface ListNavigation {
  registry: RowRegistry;
  setRef: (node: HTMLUListElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLUListElement>) => void;
  onBlurCapture: (event: FocusEvent<HTMLUListElement>) => void;
}

/** A row's share of its list's single tab stop. */
export interface RowTabStop {
  /** Whether the row's primary control holds the tab stop. */
  isActive: boolean;
  /** The ref callback for the row's primary control. */
  setPrimary: (node: HTMLElement | null) => void;
  /** Makes the row the tab stop, when focus enters it. */
  activate: () => void;
}

type ActiveRowStore = ReturnType<typeof createActiveRowStore>;

/** Registered primaries, and their ids in document order as last read. */
interface OrderedRows {
  nodes: RefObject<Map<string, HTMLElement>>;
  order: RefObject<string[]>;
  /** Registered primaries in document order; each call refreshes `order`. */
  read: () => Array<[string, HTMLElement]>;
  /** Reads once in a microtask, however many times it is asked before then. */
  queueRead: () => void;
}

interface ListState {
  list: RefObject<HTMLUListElement | null>;
  rows: OrderedRows;
  store: ActiveRowStore;
  focusedIdRef: RefObject<string | null>;
  /** Whether focus has entered the list; until then the first row holds the tab stop. */
  hasEnteredRef: RefObject<boolean>;
}

interface RemovedRow {
  id: string;
  node: HTMLElement;
  neighbours: string[];
}

const navigationKeys = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

export const RowRegistryContext = createContext<RowRegistry | null>(null);

/** Which row holds the single tab stop. Rows subscribe by id, so a move re-renders only two rows. */
function createActiveRowStore() {
  let activeId: string | null = null;
  const listeners = new Map<string, Set<() => void>>();
  const notify = (id: string | null) => {
    if (id === null) return;
    for (const listener of listeners.get(id) ?? []) listener();
  };
  return {
    getActiveId: () => activeId,
    subscribe(id: string, listener: () => void) {
      const set = listeners.get(id) ?? new Set<() => void>();
      listeners.set(id, set);
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(id);
      };
    },
    setActiveId(next: string | null) {
      if (next === activeId) return;
      const previous = activeId;
      activeId = next;
      notify(previous);
      notify(next);
    },
  };
}

/** Neighbours of `id` in `order`, nearest first, the next one before the previous at equal distance. */
function findNeighbours(order: readonly string[], id: string): string[] {
  const index = order.indexOf(id);
  if (index < 0) return [];
  const result: string[] = [];
  for (let distance = 1; distance < order.length; distance += 1) {
    const after = order[index + distance];
    if (after !== undefined) result.push(after);
    const before = index - distance >= 0 ? order[index - distance] : undefined;
    if (before !== undefined) result.push(before);
  }
  return result;
}

function isNavigationKey(event: KeyboardEvent): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  return !event.defaultPrevented && navigationKeys.has(event.key);
}

/** The row a navigation key moves to from row `index`, without wrapping. */
function resolveTargetIndex(key: string, index: number, last: number): number {
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  return clamp(index + (key === 'ArrowDown' ? 1 : -1), 0, last);
}

/**
 * After the row `removed` unregisters: hands the tab stop to the same row's replacement primary or
 * its nearest neighbour, and moves focus there when the removed row held it and focus fell out.
 */
function recoverFromRemoval(state: ListState, removed: RemovedRow) {
  const { list, rows, store, focusedIdRef, hasEnteredRef } = state;
  if (!list.current?.isConnected) return;
  const candidates = hasEnteredRef.current ? [removed.id, ...removed.neighbours] : [];
  const nextId =
    candidates.find((candidate) => rows.nodes.current.has(candidate)) ??
    rows.read()[0]?.[0] ??
    null;
  if (store.getActiveId() === removed.id) store.setActiveId(nextId);
  if (focusedIdRef.current !== removed.id || !isFocusLost(removed.node)) return;
  if (nextId === null) focusedIdRef.current = null;
  else rows.nodes.current.get(nextId)?.focus();
}

function useOrderedRows(
  listRef: RefObject<HTMLUListElement | null>,
  { primaryClass, onRead }: { primaryClass: string; onRead: (order: readonly string[]) => void },
): OrderedRows {
  const nodes = useRef(new Map<string, HTMLElement>());
  const order = useRef<string[]>([]);
  const isReadQueued = useRef(false);
  const read = useCallback(() => {
    const ids = new Map([...nodes.current].map(([id, node]) => [node, id]));
    const primaries = [
      ...(listRef.current?.querySelectorAll<HTMLElement>(`.${primaryClass}`) ?? []),
    ];
    const rows = primaries.flatMap((node): Array<[string, HTMLElement]> => {
      const id = ids.get(node);
      return id === undefined ? [] : [[id, node]];
    });
    order.current = rows.map(([id]) => id);
    onRead(order.current);
    return rows;
  }, [listRef, primaryClass, onRead]);
  const queueRead = useCallback(() => {
    if (isReadQueued.current) return;
    isReadQueued.current = true;
    queueMicrotask(() => {
      isReadQueued.current = false;
      read();
    });
  }, [read]);
  // Keyed moves and inserts change the order without any registration.
  useLayoutEffect(() => {
    const element = listRef.current;
    const Observer = element?.ownerDocument.defaultView?.MutationObserver;
    if (!element || !Observer) return;
    const observer = new Observer(read);
    observer.observe(element, { childList: true, subtree: true });
    read();
    return () => observer.disconnect();
  }, [listRef, read]);
  return useMemo(() => ({ nodes, order, read, queueRead }), [read, queueRead]);
}

function useRowRegistry(state: ListState): RowRegistry {
  const { list, rows, store, focusedIdRef, hasEnteredRef } = state;
  const register = useCallback(
    (id: string, node: HTMLElement) => {
      rows.nodes.current.set(id, node);
      if (store.getActiveId() === null) store.setActiveId(id);
      // A row enabled without a DOM change escapes the observer; one read serves a whole batch.
      rows.queueRead();
      return () => {
        // The order snapshot still holds the row: compute its neighbours before it is gone.
        const neighbours = findNeighbours(rows.order.current, id);
        if (rows.nodes.current.get(id) === node) rows.nodes.current.delete(id);
        queueMicrotask(() =>
          recoverFromRemoval(
            { list, rows, store, focusedIdRef, hasEnteredRef },
            { id, node, neighbours },
          ),
        );
      };
    },
    [list, rows, store, focusedIdRef, hasEnteredRef],
  );
  return useMemo(
    () => ({
      register,
      subscribe: store.subscribe,
      getActiveId: store.getActiveId,
      activate: (id: string) => {
        focusedIdRef.current = id;
        hasEnteredRef.current = true;
        // A disabled row's trailing control takes focus without taking the tab stop.
        if (rows.nodes.current.has(id)) store.setActiveId(id);
      },
    }),
    [register, store, rows, focusedIdRef, hasEnteredRef],
  );
}

/**
 * A list's single tab stop and arrow navigation: ArrowUp, ArrowDown, Home and End move focus between
 * the registered rows' primary controls in document order, and focus recovers when a row goes.
 */
export function useListNavigation({
  primaryClass,
  onNavigatePastStart,
  handleRef,
  ref,
}: ListNavigationOptions): ListNavigation {
  const [list, setRef] = useForwardedRef(ref);
  const [store] = useState(createActiveRowStore);
  const hasEnteredRef = useRef(false);
  // Until focus enters the list, the tab stop follows the first row as rows come and go.
  const onRead = useCallback(
    (order: readonly string[]) => {
      if (!hasEnteredRef.current && order[0] !== undefined) store.setActiveId(order[0]);
    },
    [store],
  );
  const rows = useOrderedRows(list, { primaryClass, onRead });
  const focusedIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const owner = list.current?.ownerDocument.defaultView;
    if (!owner) return;
    // A window can lose focus while its document still names the row as active.
    const clearFocusedRow = () => {
      focusedIdRef.current = null;
    };
    owner.addEventListener('blur', clearFocusedRow);
    return () => owner.removeEventListener('blur', clearFocusedRow);
  }, [list]);
  const registry = useRowRegistry({ list, rows, store, focusedIdRef, hasEnteredRef });
  useImperativeHandle(handleRef, () => ({ focusFirst: () => rows.read()[0]?.[1].focus() }), [rows]);

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (!isNavigationKey(event)) return;
    const ordered = rows.read();
    const index = ordered.findIndex(([, node]) => node === event.target);
    // Keys typed in trailing controls (inputs, menus) keep their own behaviour.
    if (index < 0) return;
    event.preventDefault();
    if (index === 0 && event.key === 'ArrowUp' && onNavigatePastStart) return onNavigatePastStart();
    ordered[resolveTargetIndex(event.key, index, ordered.length - 1)]?.[1].focus();
  };

  const onBlurCapture = (event: FocusEvent<HTMLUListElement>) => {
    const next = event.relatedTarget;
    if (!isNode(next) || !event.currentTarget.contains(next)) focusedIdRef.current = null;
  };

  return { registry, setRef, onKeyDown, onBlurCapture };
}

/**
 * A row's place in its list's single tab stop, registered while it is enabled. Outside a `List`
 * every row is its own tab stop. `primaryKind` re-registers the row when its primary control changes.
 */
export function useRowTabStop(isDisabled: boolean, primaryKind: string): RowTabStop {
  const id = useId();
  const registry = useContext(RowRegistryContext);
  const subscribe = useCallback(
    (listener: () => void) => registry?.subscribe(id, listener) ?? (() => {}),
    [registry, id],
  );
  const getIsActive = useCallback(() => !registry || registry.getActiveId() === id, [registry, id]);
  const isActive = useSyncExternalStore(subscribe, getIsActive, getIsActive);
  const primary = useRef<HTMLElement | null>(null);
  const register = registry?.register;
  useLayoutEffect(() => {
    if (!register || !primary.current || isDisabled) return;
    return register(id, primary.current);
  }, [register, id, isDisabled, primaryKind]);
  return {
    isActive,
    setPrimary: (node) => {
      primary.current = node;
    },
    activate: () => registry?.activate(id),
  };
}
