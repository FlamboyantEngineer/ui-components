import { createValueStore, type ValueStore } from '../../utils/value-store.js';
import type { ChatMessageOrigin, ChatMessageStatus } from './chat-message.js';

/** What a message tells the transcript about itself, for announcements and scrolling. */
export interface TranscriptMessageEntry {
  /** The author's display name; none for a system notice. */
  authorName: string | undefined;
  /** A plain-text summary to announce; defaults to the message's text. */
  summary: string | undefined;
  origin: ChatMessageOrigin;
  status: ChatMessageStatus;
}

/** What each message reads back from the transcript. */
export interface TranscriptView {
  /** The one message in the tab order. */
  tabStopKey: string | null;
  /** The message marked as highlighted. */
  highlightedKey: string | null;
  /** Each message's position among the messages, from 1. */
  positions: ReadonlyMap<string, number>;
  /** How many messages there are, or -1 while older ones may still load. */
  setSize: number;
}

/** Called when a message registers or changes what it tells the transcript. */
export type TranscriptEntryListener = (
  key: string,
  entry: TranscriptMessageEntry,
  previous: TranscriptMessageEntry | undefined,
) => void;

/** The messages a transcript holds, by key, and the view state they read. */
export interface TranscriptRegistry {
  readonly view: ValueStore<TranscriptView>;
  register(key: string, entry: TranscriptMessageEntry): void;
  unregister(key: string): void;
  entry(key: string): TranscriptMessageEntry | undefined;
  /** Whether the key has registered as a message since the transcript mounted. */
  hasRegistered(key: string): boolean;
  attach(key: string, element: HTMLElement | null): void;
  element(key: string): HTMLElement | null;
  /** The key of a message's element. */
  keyOf(element: Element): string | undefined;
  listen(listener: TranscriptEntryListener): () => void;
}

const emptyView: TranscriptView = {
  tabStopKey: null,
  highlightedKey: null,
  positions: new Map(),
  setSize: 0,
};

/** Creates the registry a transcript shares with its messages through context. */
export function createTranscriptRegistry(): TranscriptRegistry {
  const entries = new Map<string, TranscriptMessageEntry>();
  const registered = new Set<string>();
  const elements = new Map<string, HTMLElement>();
  const keys = new WeakMap<Element, string>();
  const listeners = new Set<TranscriptEntryListener>();
  return {
    view: createValueStore(emptyView),
    register(key, entry) {
      const previous = entries.get(key);
      entries.set(key, entry);
      registered.add(key);
      for (const listener of listeners) listener(key, entry, previous);
    },
    unregister: (key) => entries.delete(key),
    entry: (key) => entries.get(key),
    hasRegistered: (key) => registered.has(key),
    attach(key, element) {
      if (element) {
        elements.set(key, element);
        keys.set(element, key);
      } else {
        elements.delete(key);
      }
    },
    element: (key) => elements.get(key) ?? null,
    keyOf(element) {
      const key = keys.get(element);
      return key !== undefined && elements.get(key) === element ? key : undefined;
    },
    listen(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
