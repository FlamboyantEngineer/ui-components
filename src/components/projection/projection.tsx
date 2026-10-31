'use client';

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
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

type ProjectionState = ReadonlyMap<string, readonly ProjectionEntry[]>;

interface ProjectionActions {
  /** Adds the owner's content at the top of the slot's stack, or replaces it in place. */
  publish(slot: string, owner: string, content: ReactNode): void;
  withdraw(slot: string, owner: string): void;
}

// Two contexts: publishing re-renders the outlets, never the components that publish.
const ProjectionActionsContext = createContext<ProjectionActions | null>(null);
const ProjectionStateContext = createContext<ProjectionState | null>(null);

const noSlots: readonly string[] = [];

/** The slots a provider shares with its parent: every slot but its own, while it has a parent. */
function useSlotOwnership(slots: readonly string[] | undefined, parent: ProjectionActions | null) {
  const hasSlots = slots !== undefined;
  const slotList = useStableArray(slots ?? noSlots);
  return useMemo(
    () => (hasSlots && parent ? new Set(slotList) : null),
    [hasSlots, slotList, parent],
  );
}

/** Owns the named slots that `ProjectionContent` publishes to and `ProjectionOutlet` renders. */
export function ProjectionProvider({ slots, children }: ProjectionProviderProps) {
  const parentActions = useContext(ProjectionActionsContext);
  const parentState = useContext(ProjectionStateContext);
  const owned = useSlotOwnership(slots, parentActions);
  const [ownState, setState] = useState<ProjectionState>(() => new Map());

  const publish = useCallback((slot: string, owner: string, content: ReactNode) => {
    setState((current) => {
      const entries = current.get(slot) ?? [];
      const index = entries.findIndex((entry) => entry.owner === owner);
      if (index >= 0 && entries[index]?.content === content) return current;
      const nextEntries = [...entries];
      if (index >= 0) nextEntries[index] = { content, owner };
      else nextEntries.push({ content, owner });
      const next = new Map(current);
      next.set(slot, nextEntries);
      return next;
    });
  }, []);

  const withdraw = useCallback((slot: string, owner: string) => {
    setState((current) => {
      const entries = current.get(slot);
      if (!entries?.some((entry) => entry.owner === owner)) return current;
      const remaining = entries.filter((entry) => entry.owner !== owner);
      const next = new Map(current);
      if (remaining.length > 0) next.set(slot, remaining);
      else next.delete(slot);
      return next;
    });
  }, []);

  const actions = useMemo<ProjectionActions>(() => {
    if (!owned || !parentActions) return { publish, withdraw };
    return {
      publish: (slot, owner, content) =>
        (owned.has(slot) ? publish : parentActions.publish)(slot, owner, content),
      withdraw: (slot, owner) => (owned.has(slot) ? withdraw : parentActions.withdraw)(slot, owner),
    };
  }, [owned, parentActions, publish, withdraw]);

  // Outlets of the slots this provider does not own render the parent's content.
  const state = useMemo<ProjectionState>(() => {
    if (!owned || !parentState) return ownState;
    const merged = new Map(parentState);
    for (const slot of owned) {
      const entries = ownState.get(slot);
      if (entries) merged.set(slot, entries);
      else merged.delete(slot);
    }
    return merged;
  }, [owned, parentState, ownState]);

  return (
    <ProjectionActionsContext value={actions}>
      <ProjectionStateContext value={state}>{children}</ProjectionStateContext>
    </ProjectionActionsContext>
  );
}

/**
 * Declares content for a named slot. It renders nothing in place: the slot's outlet renders it.
 * Without a provider above, it renders its children in place.
 */
export function ProjectionContent({ slot, children }: ProjectionContentProps) {
  const actions = useContext(ProjectionActionsContext);
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
  const entry = useContext(ProjectionStateContext)?.get(slot)?.at(-1);
  if (!entry || isEmptyNode(entry.content)) return undefined;
  return <Fragment key={entry.owner}>{entry.content}</Fragment>;
}

/** Renders the content of the most recently mounted `ProjectionContent` for its slot. */
export function ProjectionOutlet({ slot, fallback = null }: ProjectionOutletProps) {
  return useProjectedContent(slot) ?? <Fragment key="fallback">{fallback}</Fragment>;
}
