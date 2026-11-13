'use client';

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { useLatest } from '../../utils/use-latest.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import { useTranscriptAnnouncer } from './transcript-announcer.js';
import {
  applyArrivals,
  applyHighlight,
  countUnseen,
  focusMessage,
  noteMessageChange,
  noteOlder,
} from './transcript-commit.js';
import {
  collectTranscriptItems,
  diffTranscriptKeys,
  type TranscriptChange,
  type TranscriptItem,
} from './transcript-items.js';
import type { TranscriptNavigation } from './transcript-keyboard.js';
import { collectForced, countUnread, type TranscriptKeys } from './transcript-keys.js';
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
  'strings' | 'announcer' | 'setUi' | 'setRange' | 'setWindowed' | 'requestRender'
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

/** A commit's keys and window, with how the keys changed since the last commit that read them. */
interface CommitInput extends TranscriptKeys {
  mountedItems: string[];
  change: TranscriptChange;
}

const noChange: TranscriptChange = { isReset: false, arrivals: [], older: [] };

/** What a commit's pass reads besides the keys and window. */
function readPassSettings(settings: TranscriptSettings) {
  const { scrollMode, highlightedMessageId, hasOlder, isLoadingOlder, firstUnreadId } = settings;
  const { virtualized } = settings;
  return { scrollMode, highlightedMessageId, hasOlder, isLoadingOlder, firstUnreadId, virtualized };
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
  runtime.parts = commit.parts;
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
    // Every child a transcript had mounted is measured by now, so its window can open.
    settings.setWindowed(settings.virtualized);
    for (const key of commit.mountedItems) runtime.seen.add(key);
    refreshMounted(runtime);
    publishView(runtime, settings);
    if (!applyArrivals(runtime, settings, change.arrivals)) runtime.keeper.settle();
    countUnseen(runtime, change.arrivals);
    noteOlder(runtime, settings, change.older);
    applyHighlight(runtime, settings);
    flushPendingFocus(runtime, settings);
    syncWithScroll(runtime, settings);
    // Arrivals must register and be measured in the DOM before their temporary mounts release.
    if (settings.virtualized && change.arrivals.length > 0) settings.requestRender();
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
      runtime.registry.listen((key, _entry, previous) => {
        if (!noteMessageChange(runtime, latest.current, { key, previous })) return;
        // A terminal presentation can grow before ResizeObserver gets a chance to measure it.
        measureWindow(runtime, latest.current);
        // The terminal status must commit before an offscreen streaming message can unmount.
        if (latest.current.virtualized) latest.current.requestRender();
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
  const partKeys = useShallowStable(
    useMemo(() => items.filter((item) => item.isPart).map((item) => item.key), [items]),
  );
  const parts = useMemo(() => new Set(partKeys), [partKeys]);
  // Diffed once per new keys array, against the keys the last commit read.
  const change = useMemo(
    // A part is known by this render's children, or by what the last commit and its mounts told.
    () =>
      diffTranscriptKeys(
        runtime.keys,
        keys,
        (key) => parts.has(key) || !isTranscriptMessage(runtime, key),
      ),
    [runtime, keys, parts],
  );
  const announcer = useTranscriptAnnouncer(strings);
  const [ui, setUi] = useState(initialUi);
  const [range, setRange] = useState<WindowRange | null>(null);
  // A transcript that turns virtualized keeps every child through one commit, which measures them:
  // its window then starts from their true heights, and the reader's place holds.
  const [isWindowed, setWindowed] = useState(options.virtualized);
  const [, setRenders] = useState(0);
  const requestRender = useCallback(() => setRenders((count) => count + 1), []);
  const latest = useLatest<TranscriptSettings>({
    ...options,
    strings,
    announcer,
    setUi,
    setRange,
    setWindowed,
    requestRender,
  });
  const forced = collectForced(
    runtime,
    { keys, indexOf, parts },
    {
      arrivals: runtime.keys !== keys ? change.arrivals : [],
      highlight: resolveMessageKey(runtime, options.highlightedMessageId),
    },
  );
  const mounted =
    options.virtualized && isWindowed
      ? selectMounted(indexOf, range ?? resolveTailRange(keys), forced)
      : null;
  const mountedItems = useShallowStable(
    mounted ? mounted.map((index) => keys[index] as string) : keys,
  );
  useCommit(runtime, latest, { keys, indexOf, parts, mountedItems, change });
  useObservers(runtime, latest, items.length === 0);
  return {
    runtime,
    items,
    mounted,
    ui,
    unreadCount: countUnread(runtime, { keys, indexOf, parts }, options.firstUnreadId),
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
