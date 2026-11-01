import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { UiStrings } from '../../core/strings.js';
import type { TranscriptAnnouncer } from './transcript-announcer.js';
import type { RevealAlignment } from './transcript-geometry.js';
import { createTranscriptRegistry, type TranscriptRegistry } from './transcript-registry.js';
import { createScrollKeeper, type ScrollKeeper } from './transcript-scroll.js';
import { createTabbablesManager, type TabbablesManager } from './transcript-tabbables.js';
import { createWindowModel, type WindowModel, type WindowRange } from './transcript-window.js';

/** `follow` keeps the latest message in view; `anchor` keeps the reader's sent message at the top. */
export type ChatTranscriptScrollMode = 'follow' | 'anchor';

/** What the transcript draws around its messages. */
export interface TranscriptUi {
  /** The reader scrolled away from the bottom. */
  isAway: boolean;
  /** Messages that arrived out of view since the reader scrolled away. */
  unseenCount: number;
  /** The first unread message is above the view. */
  isUnreadAbove: boolean;
}

/** The transcript's latest props and the React setters its runtime calls. */
export interface TranscriptSettings {
  scrollMode: ChatTranscriptScrollMode;
  virtualized: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder?: (() => void) | undefined;
  highlightedMessageId?: string | undefined;
  firstUnreadId?: string | undefined;
  onRead?: ((lastSeenId: string) => void) | undefined;
  onEscape?: (() => void) | undefined;
  strings: UiStrings;
  announcer: TranscriptAnnouncer;
  setUi: Dispatch<SetStateAction<TranscriptUi>>;
  setRange: Dispatch<SetStateAction<WindowRange | null>>;
  /** Renders again, for a focus target that has to mount first. */
  requestRender: () => void;
}

/** A message to bring into view; `focus: false` leaves focus where it is. */
export interface RevealTarget {
  key: string;
  align: RevealAlignment;
  focus?: boolean | undefined;
}

/** The transcript's long-lived state, outside React: elements, scroll keeping and bookkeeping. */
export interface TranscriptRuntime {
  registry: TranscriptRegistry;
  keeper: ScrollKeeper;
  windowModel: WindowModel;
  tabbables: TabbablesManager;
  viewport: RefObject<HTMLDivElement | null>;
  feed: RefObject<HTMLDivElement | null>;
  spacer: RefObject<HTMLDivElement | null>;
  /** The children's keys at the last commit; `null` before the first. */
  keys: string[] | null;
  indexOf: ReadonlyMap<string, number>;
  /** The keys of the children mounted at the last commit, in order. */
  mountedItems: readonly string[];
  /** The mounted messages, oldest first. */
  mounted: { keys: string[]; elements: HTMLElement[] };
  /** Children mounted at least once, so a child that never registered is known not to be a message. */
  seen: Set<string>;
  activeKey: string | null;
  pendingFocus: RevealTarget | null;
  /** Arrivals out of view since the reader scrolled away. */
  unseen: Set<string>;
  /** Arrivals still streaming, announced once they complete. */
  streaming: Set<string>;
  olderRequested: boolean;
  wasLoadingOlder: boolean;
  handledHighlight: string | null;
  readKey: string | null;
  reportedKey: string | null;
  timers: Map<'read' | 'page', ReturnType<typeof setTimeout>>;
  isPaging: boolean;
}

/** Creates the runtime once per transcript. */
export function createTranscriptRuntime(): TranscriptRuntime {
  const registry = createTranscriptRegistry();
  const viewport: RefObject<HTMLDivElement | null> = { current: null };
  const spacer: RefObject<HTMLDivElement | null> = { current: null };
  const runtime: TranscriptRuntime = {
    registry,
    keeper: createScrollKeeper({
      viewport: () => viewport.current,
      spacer: () => spacer.current,
      element: (key) => registry.element(key),
      mounted: () => runtime.mounted,
    }),
    windowModel: createWindowModel(),
    tabbables: createTabbablesManager(registry),
    viewport,
    feed: { current: null },
    spacer,
    keys: null,
    indexOf: new Map(),
    mountedItems: [],
    mounted: { keys: [], elements: [] },
    seen: new Set(),
    activeKey: null,
    pendingFocus: null,
    unseen: new Set(),
    streaming: new Set(),
    olderRequested: false,
    wasLoadingOlder: false,
    handledHighlight: null,
    readKey: null,
    reportedKey: null,
    timers: new Map(),
    isPaging: false,
  };
  return runtime;
}

/** Whether a child is a message: it registered as one, or it never mounted to say otherwise. */
export function isTranscriptMessage(runtime: TranscriptRuntime, key: string): boolean {
  return runtime.registry.hasRegistered(key) || !runtime.seen.has(key);
}

/** Every message's key, oldest first. */
export function listMessageKeys(runtime: TranscriptRuntime): string[] {
  return (runtime.keys ?? []).filter((key) => isTranscriptMessage(runtime, key));
}

/** The newest message's key. */
export function findLastMessageKey(runtime: TranscriptRuntime): string | null {
  return (runtime.keys ?? []).findLast((key) => runtime.registry.hasRegistered(key)) ?? null;
}

/** Re-reads which messages are mounted, after a commit. */
export function refreshMounted(runtime: TranscriptRuntime) {
  const keys: string[] = [];
  const elements: HTMLElement[] = [];
  for (const key of runtime.keys ?? []) {
    const element = runtime.registry.element(key);
    if (element) {
      keys.push(key);
      elements.push(element);
    }
  }
  runtime.mounted = { keys, elements };
}

/** The child key of a message id the host names, if any. */
export function resolveMessageKey(runtime: TranscriptRuntime, id: string | undefined) {
  return id === undefined ? undefined : runtime.registry.keyFor(id);
}

/** Publishes the tab stop, positions and highlight each message reads. */
export function publishView(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const keys = listMessageKeys(runtime);
  const active = runtime.activeKey;
  const positions = new Map(keys.map((key, index) => [key, index + 1]));
  const highlighted = resolveMessageKey(runtime, settings.highlightedMessageId) ?? null;
  runtime.registry.view.set({
    tabStopKey: active !== null && positions.has(active) ? active : findLastMessageKey(runtime),
    highlightedKey: highlighted !== null && positions.has(highlighted) ? highlighted : null,
    positions,
    setSize: settings.hasOlder ? -1 : keys.length,
  });
}

/**
 * The text a message announces without a summary: the text of the content it registered (else of
 * the whole message), whitespace collapsed.
 */
export function readMessageText(runtime: TranscriptRuntime, key: string): string {
  const element = runtime.registry.content(key) ?? runtime.registry.element(key);
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Starts over for another conversation. */
export function resetConversation(runtime: TranscriptRuntime) {
  runtime.registry.forgetUnmounted();
  runtime.seen.clear();
  runtime.keeper.reset();
  runtime.windowModel.reset();
  runtime.activeKey = null;
  runtime.unseen.clear();
  runtime.streaming.clear();
  runtime.readKey = null;
  runtime.reportedKey = null;
  runtime.handledHighlight = null;
  runtime.olderRequested = false;
  runtime.isPaging = false;
  for (const timer of runtime.timers.values()) clearTimeout(timer);
  runtime.timers.clear();
}
