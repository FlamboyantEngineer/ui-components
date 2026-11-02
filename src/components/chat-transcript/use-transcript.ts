'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { useLatest } from '../../utils/use-latest.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import {
  announceMessage,
  applyArrivals,
  applyHighlight,
  countUnseen,
  focusMessage,
  noteOlder,
} from './transcript-commit.js';
import { useTranscriptAnnouncer } from './transcript-announcer.js';
import {
  collectTranscriptItems,
  diffTranscriptKeys,
  type TranscriptChange,
  type TranscriptItem,
} from './transcript-items.js';
import type { TranscriptNavigation } from './transcript-keyboard.js';
import {
  createTranscriptRuntime,
  findLastMessageKey,
  isTranscriptMessage,
  listMessageKeys,
  publishView,
  refreshMounted,
  resetConversation,
  resolveMessageKey,
  type TranscriptRuntime,
  type TranscriptSettings,
  type TranscriptUi,
} from './transcript-runtime.js';
import { focusAfterPaging, noteSeen, syncWithScroll } from './transcript-sync.js';
import { resolveTailRange, selectMounted, type WindowRange } from './transcript-window.js';

/** The transcript's props that drive its behaviour. */
type TranscriptOptions = Omit<
  TranscriptSettings,
  'strings' | 'announcer' | 'setUi' | 'setRange' | 'requestRender'
> & { children: ReactNode };

/** What the transcript renders and wires up. */
export interface TranscriptModel {
  runtime: TranscriptRuntime;
  items: TranscriptItem[];
  /** The indices of the children to mount, or `null` to mount them all. */
  mounted: number[] | null;
  ui: TranscriptUi;
  unreadCount: number;
  announcement: string;
  navigation: TranscriptNavigation;
  onScroll(): void;
  jumpToLatest(): void;
  jumpToUnread(): void;
}

const initialUi: TranscriptUi = { isAway: false, unseenCount: 0, isUnreadAbove: false };

/** Measures the mounted children of a virtualized transcript. */
function measureWindow(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const feed = runtime.feed.current;
  if (settings.virtualized && feed) runtime.windowModel.measure(feed, runtime.mountedItems);
}

/** The children a virtualized transcript keeps mounted wherever its window is. */
function collectForced(
  runtime: TranscriptRuntime,
  keys: readonly string[],
  { arrivals, highlight }: { arrivals: readonly string[]; highlight: string | undefined },
) {
  return [
    runtime.activeKey,
    runtime.pendingFocus?.key,
    runtime.keeper.anchorKey(),
    runtime.keeper.snapshot()?.key,
    runtime.registry.view.get().tabStopKey,
    highlight,
    ...keys.slice(-2),
    ...arrivals,
  ];
}

/** How many messages there are from the first unread one to the end, read from there on. */
function countUnread(
  runtime: TranscriptRuntime,
  { keys, indexOf }: { keys: readonly string[]; indexOf: ReadonlyMap<string, number> },
  firstUnreadId?: string,
) {
  const key = resolveMessageKey(runtime, firstUnreadId);
  const start = key === undefined ? undefined : indexOf.get(key);
  if (start === undefined) return 0;
  let count = 0;
  for (let index = start; index < keys.length; index += 1) {
    if (isTranscriptMessage(runtime, keys[index] as string)) count += 1;
  }
  return count;
}

/** A commit's keys and window, with how the keys changed since the last commit that read them. */
interface CommitInput {
  keys: string[];
  indexOf: ReadonlyMap<string, number>;
  mountedItems: string[];
  change: TranscriptChange;
}

const noChange: TranscriptChange = { isReset: false, arrivals: [], older: [] };

/** What a commit's pass reads besides the keys and window. */
function readPassSettings(settings: TranscriptSettings) {
  const { scrollMode, highlightedMessageId, hasOlder, isLoadingOlder, firstUnreadId } = settings;
  return { scrollMode, highlightedMessageId, hasOlder, isLoadingOlder, firstUnreadId };
}

/** Focuses the message a focus request waited on, once a commit mounted it. */
function flushPendingFocus(runtime: TranscriptRuntime, settings: TranscriptSettings) {
  const pending = runtime.pendingFocus;
  runtime.pendingFocus = null;
  if (pending && runtime.registry.element(pending.key)) focusMessage(runtime, settings, pending);
}

/** Records what a commit rendered, for the next commit to compare with. */
function recordCommit(runtime: TranscriptRuntime, commit: CommitInput) {
  runtime.keys = commit.keys;
  runtime.indexOf = commit.indexOf;
  runtime.mountedItems = commit.mountedItems;
}

/**
 * Processes a commit that changed the keys, the window or the settings the pass reads: arrivals,
 * scroll keeping, announcements, highlight and pending focus. A commit that changed none of them,
 * such as a token streaming into a message, only flushes a pending focus; the content's resize
 * keeps the scroll position.
 */
function useCommit(
  runtime: TranscriptRuntime,
  latest: RefObject<TranscriptSettings>,
  commit: CommitInput,
) {
  const lastPass = useRef<{ mountedItems: string[]; settings: object } | null>(null);
  useLayoutEffect(() => {
    const settings = latest.current;
    const passSettings = readPassSettings(settings);
    const isNewKeys = runtime.keys !== commit.keys;
    const last = lastPass.current;
    if (
      !isNewKeys &&
      last?.mountedItems === commit.mountedItems &&
      isShallowEqual(last.settings, passSettings)
    ) {
      flushPendingFocus(runtime, settings);
      return;
    }
    lastPass.current = { mountedItems: commit.mountedItems, settings: passSettings };
    const change = isNewKeys ? commit.change : noChange;
    recordCommit(runtime, commit);
    if (change.isReset) resetConversation(runtime);
    if (settings.scrollMode !== 'anchor' && runtime.keeper.anchorKey() !== null) {
      runtime.keeper.anchor(null);
    }
    measureWindow(runtime, settings);
    for (const key of commit.mountedItems) runtime.seen.add(key);
    refreshMounted(runtime);
    publishView(runtime, settings);
    if (!applyArrivals(runtime, settings, change.arrivals)) runtime.keeper.settle();
    countUnseen(runtime, change.arrivals);
    noteOlder(runtime, settings, change.older);
    applyHighlight(runtime, settings);
    flushPendingFocus(runtime, settings);
    syncWithScroll(runtime, settings);
  });
}

/** Observers: controls inside messages out of the tab order, and size changes of the content. */
function useObservers(
  runtime: TranscriptRuntime,
  latest: RefObject<TranscriptSettings>,
  isEmpty: boolean,
) {
  useLayoutEffect(() => {
    const feed = runtime.feed.current;
    return feed ? runtime.tabbables.observe(feed) : undefined;
  }, [runtime, isEmpty]);
  useEffect(() => {
    const viewport = runtime.viewport.current;
    const view = viewport?.ownerDocument.defaultView;
    if (!viewport || !view || typeof view.ResizeObserver !== 'function') return undefined;
    const observer = new view.ResizeObserver(() => {
      measureWindow(runtime, latest.current);
      runtime.keeper.settle();
      syncWithScroll(runtime, latest.current);
    });
    observer.observe(viewport);
    if (runtime.feed.current) observer.observe(runtime.feed.current);
    return () => observer.disconnect();
  }, [runtime, latest, isEmpty]);
  useEffect(
    () =>
      runtime.registry.listen((key, entry) => {
        if (!runtime.streaming.has(key) || entry.status === 'streaming') return;
        runtime.streaming.delete(key);
        if (entry.status === 'complete') announceMessage(runtime, latest.current, key);
      }),
    [runtime, latest],
  );
  useEffect(
    () => () => {
      for (const timer of runtime.timers.values()) clearTimeout(timer);
      runtime.timers.clear();
    },
    [runtime],
  );
}

/** The keyboard model's view of the transcript. */
function createNavigation(
  runtime: TranscriptRuntime,
  latest: RefObject<TranscriptSettings>,
  onEscape: (() => void) | undefined,
): TranscriptNavigation {
  return {
    registry: runtime.registry,
    tabbables: runtime.tabbables,
    messageKeys: () => listMessageKeys(runtime),
    focusMessage: (key, align) => focusMessage(runtime, latest.current, { key, align }),
    onActiveChange(key) {
      runtime.activeKey = key;
      publishView(runtime, latest.current);
      if (key !== null) noteSeen(runtime, latest.current, key);
    },
    onPage() {
      runtime.isPaging = true;
    },
    onEscape,
  };
}

/** The transcript's behaviour: everything but its markup. */
export function useTranscript({ children, ...options }: TranscriptOptions): TranscriptModel {
  const strings = useUiStrings();
  const [runtime] = useState(createTranscriptRuntime);
  const items = useMemo(() => collectTranscriptItems(children), [children]);
  // New children with the same keys, as each streamed token brings, keep the same keys array.
  const itemKeys = useMemo(() => items.map((item) => item.key), [items]);
  const keys = useShallowStable(itemKeys);
  const indexOf = useMemo(() => new Map(keys.map((key, index) => [key, index])), [keys]);
  // Diffed once per new keys array, against the keys the last commit read.
  const change = useMemo(() => diffTranscriptKeys(runtime.keys, keys), [runtime, keys]);
  const announcer = useTranscriptAnnouncer(strings);
  const [ui, setUi] = useState(initialUi);
  const [range, setRange] = useState<WindowRange | null>(null);
  const [, setRenders] = useState(0);
  const requestRender = useCallback(() => setRenders((count) => count + 1), []);
  const latest = useLatest<TranscriptSettings>({
    ...options,
    strings,
    announcer,
    setUi,
    setRange,
    requestRender,
  });
  const forced = collectForced(runtime, keys, {
    arrivals: runtime.keys === null ? [] : change.arrivals,
    highlight: resolveMessageKey(runtime, options.highlightedMessageId),
  });
  const mounted = options.virtualized
    ? selectMounted(indexOf, range ?? resolveTailRange(keys), forced)
    : null;
  const mountedItems = useShallowStable(
    mounted ? mounted.map((index) => keys[index] as string) : keys,
  );
  useCommit(runtime, latest, { keys, indexOf, mountedItems, change });
  useObservers(runtime, latest, items.length === 0);
  return {
    runtime,
    items,
    mounted,
    ui,
    unreadCount: countUnread(runtime, { keys, indexOf }, options.firstUnreadId),
    announcement: announcer.text,
    navigation: createNavigation(runtime, latest, options.onEscape),
    onScroll() {
      runtime.keeper.scrolled();
      syncWithScroll(runtime, latest.current);
      focusAfterPaging(runtime);
    },
    jumpToLatest() {
      runtime.unseen.clear();
      runtime.keeper.holdBottom();
      syncWithScroll(runtime, latest.current);
      const key = findLastMessageKey(runtime);
      (key === null ? null : runtime.registry.element(key))?.focus({ preventScroll: true });
    },
    jumpToUnread() {
      const key = resolveMessageKey(runtime, options.firstUnreadId);
      if (key !== undefined) focusMessage(runtime, latest.current, { key, align: 'start' });
    },
  };
}
