import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface ProjectionEntry {
  readonly content: ReactNode;
  readonly owner: object;
}

type ProjectionState = ReadonlyMap<string, readonly ProjectionEntry[]>;

interface ProjectionActions {
  /** Adds the owner's content at the top of the slot's stack, or replaces it in place. */
  publish(slot: string, owner: object, content: ReactNode): void;
  withdraw(slot: string, owner: object): void;
}

// Two contexts: publishing re-renders the outlets, never the components that publish.
const ProjectionActionsContext = createContext<ProjectionActions | null>(null);
const ProjectionStateContext = createContext<ProjectionState | null>(null);

export interface ProjectionProviderProps {
  children?: ReactNode;
}

/** Owns the named slots that `ProjectionContent` publishes to and `ProjectionOutlet` renders. */
export function ProjectionProvider({ children }: ProjectionProviderProps) {
  const [state, setState] = useState<ProjectionState>(() => new Map());

  const publish = useCallback((slot: string, owner: object, content: ReactNode) => {
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

  const withdraw = useCallback((slot: string, owner: object) => {
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

  const actions = useMemo<ProjectionActions>(() => ({ publish, withdraw }), [publish, withdraw]);

  return (
    <ProjectionActionsContext.Provider value={actions}>
      <ProjectionStateContext.Provider value={state}>{children}</ProjectionStateContext.Provider>
    </ProjectionActionsContext.Provider>
  );
}

export interface ProjectionContentProps {
  /** The slot name an outlet renders. */
  slot: string;
  children?: ReactNode;
}

/**
 * Declares content for a named slot. It renders nothing in place: the slot's outlet renders it.
 * Without a provider above, it renders its children in place.
 */
export function ProjectionContent({ slot, children }: ProjectionContentProps) {
  const actions = useContext(ProjectionActionsContext);
  const [owner] = useState<object>(() => ({}));

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

export interface ProjectionOutletProps {
  /** The slot name to render. */
  slot: string;
  /** Rendered while the slot has no content. */
  fallback?: ReactNode;
}

/** Renders the content of the most recently mounted `ProjectionContent` for its slot. */
export function ProjectionOutlet({ slot, fallback = null }: ProjectionOutletProps) {
  const state = useContext(ProjectionStateContext);
  const content = state?.get(slot)?.at(-1)?.content;
  return <>{content ?? fallback}</>;
}
