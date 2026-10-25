import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type RefCallback,
} from 'react';
import { createValueStore } from '../../utils/value-store.js';
import type { ChatMessageOrigin, ChatMessageStatus } from './chat-message.js';
import type { TranscriptRegistry, TranscriptView } from './transcript-registry.js';

/** What a message registers with the transcript it sits in. */
export interface TranscriptMessageRegistration {
  /** The author's display name, announced as "New message from …"; none for a notice. */
  authorName?: string | undefined;
  /** A plain-text summary to announce; defaults to the text of the message's content. */
  summary?: string | undefined;
  origin: ChatMessageOrigin;
  status: ChatMessageStatus;
}

/** Props a message spreads on its `<article>` so the transcript can find, focus and mark it. */
export interface TranscriptMessageProps {
  ref?: RefCallback<HTMLElement> | undefined;
  tabIndex?: number | undefined;
  'aria-posinset'?: number | undefined;
  'aria-setsize'?: number | undefined;
  'data-highlighted'?: 'true' | undefined;
}

/** The transcript's registry, for the messages inside it. */
export const TranscriptContext = createContext<TranscriptRegistry | null>(null);

/** The key of the transcript child a message renders inside. */
export const TranscriptItemContext = createContext<string | null>(null);

const detachedView = createValueStore<TranscriptView>({
  tabStopKey: null,
  highlightedKey: null,
  positions: new Map(),
  setSize: 0,
});

/** One value read from the transcript's view store for this message. */
function useViewValue<T>(
  registry: TranscriptRegistry | null,
  select: (view: TranscriptView) => T,
): T {
  const store = registry?.view ?? detachedView;
  const read = () => select(store.get());
  return useSyncExternalStore(store.subscribe, read, read);
}

/**
 * Registers a message with the transcript it renders in and returns the props for its
 * `<article>`: its place in the transcript's single tab stop, its position in the feed and the
 * highlight. Outside a transcript it returns no props.
 */
export function useTranscriptMessage({
  authorName,
  summary,
  origin,
  status,
}: TranscriptMessageRegistration): TranscriptMessageProps {
  const registry = useContext(TranscriptContext);
  const key = useContext(TranscriptItemContext);
  const isInside = registry !== null && key !== null;
  const ref = useCallback(
    (element: HTMLElement | null) => {
      if (registry && key !== null) registry.attach(key, element);
    },
    [registry, key],
  );
  useLayoutEffect(() => {
    if (registry && key !== null) registry.register(key, { authorName, summary, origin, status });
  }, [registry, key, authorName, summary, origin, status]);
  useLayoutEffect(() => {
    if (!registry || key === null) return undefined;
    return () => {
      registry.unregister(key);
    };
  }, [registry, key]);
  const tabIndex = useViewValue(registry, (view) => (view.tabStopKey === key ? 0 : -1));
  const position = useViewValue(registry, (view) => view.positions.get(key ?? ''));
  const setSize = useViewValue(registry, (view) => view.setSize);
  const isHighlighted = useViewValue(
    registry,
    (view) => key !== null && view.highlightedKey === key,
  );
  if (!isInside) return {};
  return {
    ref,
    tabIndex,
    'aria-posinset': position,
    'aria-setsize': position === undefined ? undefined : setSize,
    'data-highlighted': isHighlighted ? 'true' : undefined,
  };
}
