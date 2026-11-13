'use client';

import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useStableArray } from '../../utils/use-stable-array.js';

export interface ProjectionProviderProps {
  /** The content that publishes to and renders the slots. */
  children?: ReactNode;
  /**
   * The only slots this provider owns. Content and outlets of other slots below it reach the
   * enclosing provider, as if this one were not there. Without it the provider owns every slot.
   */
  slots?: readonly string[] | undefined;
}

export interface ProjectionContentProps {
  /** The slot name an outlet renders. */
  slot: string;
  /** The content the slot's outlet renders. */
  children?: ReactNode;
}

export interface ProjectionOutletProps {
  /** The slot name to render. */
  slot: string;
  /** Rendered while the slot has no content. */
  fallback?: ReactNode;
}

interface ProjectionEntry {
  readonly content: ReactNode;
  /** The publishing `ProjectionContent`, unique in the React root. */
  readonly owner: string;
}

/**
 * The slots' content, read and watched one slot at a time: a component that reads one slot never
 * renders again for another, so it may publish to a second slot what it read from the first.
 */
interface ProjectionStore {
  /** The slot's stack of content, the latest last; the same array until the slot changes. */
  get(slot: string): readonly ProjectionEntry[] | undefined;
  /** Calls `listener` whenever the slot's stack changes. */
  subscribe(slot: string, listener: () => void): () => void;
  /** Adds the owner's content at the top of the slot's stack, or replaces it in place. */
  publish(slot: string, owner: string, content: ReactNode): void;
  withdraw(slot: string, owner: string): void;
}

// The store never changes for a provider's lifetime, so publishing re-renders only the slot's readers.
const ProjectionStoreContext = createContext<ProjectionStore | null>(null);

const noSlots: readonly string[] = [];

/** A store of every slot's content, telling each slot's own listeners when it changes. */
function createProjectionStore(): ProjectionStore {
  const entries = new Map<string, readonly ProjectionEntry[]>();
  const listeners = new Map<string, Set<() => void>>();
  const update = (slot: string, next: readonly ProjectionEntry[]) => {
    if (next.length > 0) entries.set(slot, next);
    else entries.delete(slot);
    for (const listener of [...(listeners.get(slot) ?? [])]) listener();
  };
  return {
    get: (slot) => entries.get(slot),
    subscribe(slot, listener) {
      const slotListeners = listeners.get(slot) ?? new Set();
      listeners.set(slot, slotListeners);
      slotListeners.add(listener);
      return () => {
        slotListeners.delete(listener);
        if (slotListeners.size === 0) listeners.delete(slot);
      };
    },
    publish(slot, owner, content) {
      const current = entries.get(slot) ?? [];
      const index = current.findIndex((entry) => entry.owner === owner);
      if (index >= 0 && current[index]?.content === content) return;
      const next = [...current];
      if (index >= 0) next[index] = { content, owner };
      else next.push({ content, owner });
      update(slot, next);
    },
    withdraw(slot, owner) {
      const current = entries.get(slot);
      if (!current?.some((entry) => entry.owner === owner)) return;
      update(
        slot,
        current.filter((entry) => entry.owner !== owner),
      );
    },
  };
}

/** A store whose `owned` slots are its own and whose other slots are the parent's. */
function routeSlots(
  owned: ReadonlySet<string>,
  own: ProjectionStore,
  parent: ProjectionStore,
): ProjectionStore {
  const storeOf = (slot: string) => (owned.has(slot) ? own : parent);
  return {
    get: (slot) => storeOf(slot).get(slot),
    subscribe: (slot, listener) => storeOf(slot).subscribe(slot, listener),
    publish: (slot, owner, content) => storeOf(slot).publish(slot, owner, content),
    withdraw: (slot, owner) => storeOf(slot).withdraw(slot, owner),
  };
}

/** The slots a provider shares with its parent: every slot but its own, while it has a parent. */
function useSlotOwnership(slots: readonly string[] | undefined, parent: ProjectionStore | null) {
  const hasSlots = slots !== undefined;
  const slotList = useStableArray(slots ?? noSlots);
  return useMemo(
    () => (hasSlots && parent ? new Set(slotList) : null),
    [hasSlots, slotList, parent],
  );
}

/** Owns the named slots that `ProjectionContent` publishes to and `ProjectionOutlet` renders. */
export function ProjectionProvider({ slots, children }: ProjectionProviderProps) {
  const parent = useContext(ProjectionStoreContext);
  const owned = useSlotOwnership(slots, parent);
  const [own] = useState(createProjectionStore);
  // Outlets and content of the slots this provider does not own reach the parent's store.
  const store = useMemo(
    () => (owned && parent ? routeSlots(owned, own, parent) : own),
    [owned, parent, own],
  );
  return <ProjectionStoreContext value={store}>{children}</ProjectionStoreContext>;
}

/**
 * Declares content for a named slot. It renders nothing in place: the slot's outlet renders it.
 * Without a provider above, it renders its children in place.
 */
export function ProjectionContent({ slot, children }: ProjectionContentProps) {
  const actions = useContext(ProjectionStoreContext);
  const owner = useId();

  // Leaving the slot (unmount or a new slot name) withdraws the content.
  useLayoutEffect(() => {
    if (!actions) return undefined;
    return () => actions.withdraw(slot, owner);
  }, [actions, owner, slot]);

  // The first publish joins the top of the stack; later ones update in place.
  useLayoutEffect(() => {
    actions?.publish(slot, owner, children);
  }, [actions, owner, slot, children]);

  return actions ? null : <>{children}</>;
}

/**
 * The content of the most recently mounted `ProjectionContent` for `slot`, or `undefined` while the
 * slot has none, so a component can leave out the element that would hold it. The content is keyed
 * by its publisher: state inside it survives the publisher's updates and never passes to another.
 */
export function useProjectedContent(slot: string): ReactNode {
  const store = useContext(ProjectionStoreContext);
  const subscribe = useCallback(
    (listener: () => void) => store?.subscribe(slot, listener) ?? (() => {}),
    [store, slot],
  );
  const read = () => store?.get(slot);
  const entry = useSyncExternalStore(subscribe, read, read)?.at(-1);
  if (!entry || isEmptyNode(entry.content)) return undefined;
  return <Fragment key={entry.owner}>{entry.content}</Fragment>;
}

/** Renders the content of the most recently mounted `ProjectionContent` for its slot. */
export function ProjectionOutlet({ slot, fallback = null }: ProjectionOutletProps) {
  return useProjectedContent(slot) ?? <Fragment key="fallback">{fallback}</Fragment>;
}
