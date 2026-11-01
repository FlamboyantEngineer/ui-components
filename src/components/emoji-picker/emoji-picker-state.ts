'use client';

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useLatest } from '../../utils/use-latest.js';
import { createValueStore, type ValueStore } from '../../utils/value-store.js';
import {
  addRecentEmoji,
  getEmojiKey,
  resolveEmojiKeys,
  searchEmoji,
  toEmojiSelection,
  type CustomEmoji,
  type EmojiEntry,
  type EmojiSelection,
  type EmojiCategory,
  type NativeEmoji,
  type SkinTone,
} from './emoji-catalog.js';
import { filterNativeEmoji } from './emoji-filter.js';
import type { EmojiGridOptions } from './emoji-grid.js';
import { loadEmojiData, resolveEmojiLocale } from './emoji-locale.js';
import { EmojiPickerDismissContext } from './emoji-picker-context.js';
import { useEmojiSupport } from './emoji-support.js';
import { callSettling } from '../../utils/is-thenable.js';

interface EmojiData {
  emoji: readonly NativeEmoji[] | null;
  failed: boolean;
}

interface EmojiTab {
  id: string;
  entries: EmojiEntry[];
}

/** The skin tone as a controlled or uncontrolled value. */
export interface SkinToneState {
  /** The skin tone applied to emoji that take one (controlled). */
  skinTone?: SkinTone | undefined;
  /** The initial skin tone when uncontrolled. Defaults to `default`. */
  defaultSkinTone?: SkinTone | undefined;
  /** Called with the tone the reader picks. */
  onSkinToneChange?: ((tone: SkinTone) => void) | undefined;
}

/** The emoji the host supplies besides the standard set. */
export interface EmojiSources {
  /** Recently used emoji, most recent first: standard glyphs and `:shortcode:` for custom emoji. */
  recentEmoji?: readonly string[] | undefined;
  /** Image emoji, shown under their own category and in search results. */
  customEmoji?: readonly CustomEmoji[] | undefined;
}

/** Which standard emoji the picker offers. */
export interface EmojiChoiceFilters {
  /** The standard categories to offer, in order. Defaults to all nine. */
  categories?: readonly EmojiCategory[] | undefined;
  /**
   * Leaves out emoji newer than this Emoji version (`14`), in place of the newest version the
   * platform draws, which the picker otherwise finds itself.
   */
  emojiVersion?: number | undefined;
  /** Keeps the standard emoji for which it returns `true`; the others are offered nowhere. */
  filterEmoji?: ((emoji: NativeEmoji) => boolean) | undefined;
}

/** What choosing an emoji reports to the host. */
export interface EmojiChoiceHandlers {
  /** Called with the chosen emoji. Inside a dialog trigger, choosing also closes the overlay. */
  onSelect?: ((selection: EmojiSelection) => void) | undefined;
  /** Called after a choice with the updated recent list, most recent first, for the host to keep. */
  onRecentEmojiChange?: ((recent: string[]) => void) | undefined;
}

interface EmojiSearchState {
  query: string;
  /** Whether the query is not blank, so results replace the categories. */
  isSearching: boolean;
  /** The best matches for the query. */
  results: EmojiEntry[];
  setQuery(query: string): void;
}

interface ChooseEmojiOptions extends EmojiChoiceHandlers, Pick<EmojiSources, 'recentEmoji'> {
  tone: SkinTone;
}

/** Everything the picker's parts read. */
export interface EmojiPickerState {
  /** The offered standard emoji, `null` while they load or the platform is being measured. */
  data: EmojiData;
  search: EmojiSearchState;
  tabs: EmojiTab[];
  /** The selected category tab. */
  tab: EmojiTab | undefined;
  setTabId(id: string): void;
  /** The options every grid shares. */
  grid: EmojiGridOptions;
  /** The grid shown, which Down in the search field moves to. */
  gridRef: RefObject<HTMLDivElement | null>;
  /** Moves focus to the first emoji of the grid shown, mounted or not; nothing without a grid. */
  enterGrid(): void;
  tone: SkinTone;
  setTone(tone: SkinTone): void;
  /**
   * The emoji last hovered or focused, in a store of its own, so a hover re-renders only the parts
   * that show it.
   */
  activeEmoji: ValueStore<EmojiEntry | null>;
  /** Chooses the first emoji shown, for Enter in the search field; nothing while none is shown. */
  chooseFirst(): void;
  autoFocus: boolean | undefined;
}

/** The picker props its state comes from. */
export interface EmojiPickerStateOptions
  extends SkinToneState, EmojiSources, EmojiChoiceHandlers, EmojiChoiceFilters {
  onSearchChange?: ((value: string) => void) | undefined;
  autoFocus?: boolean | undefined;
  /**
   * Loads the standard emoji in place of the bundled set. Called once per picker, so a new function
   * on a later render loads nothing; give the picker a new `key` to load again.
   */
  loadEmoji?: (() => Promise<readonly NativeEmoji[]>) | undefined;
  /** Draws a standard emoji's glyph, such as an image from an emoji font, in place of the text. */
  renderEmoji?: ((unicode: string) => ReactNode) | undefined;
  /** Renders only the emoji in view of each grid, which then scrolls itself. */
  virtualized?: boolean | undefined;
  /** The picker element, whose font the platform support is measured in. */
  rootRef: RefObject<HTMLElement | null>;
}

type EmojiLoader = () => Promise<readonly NativeEmoji[]>;

const searchLimit = 60;
const recentLimit = 24;
const noKeys: readonly string[] = [];
const noCustomEmoji: readonly CustomEmoji[] = [];

function buildTabs(emoji: readonly NativeEmoji[], recent: EmojiEntry[], custom: EmojiEntry[]) {
  const tabs: EmojiTab[] = [];
  if (recent.length > 0) tabs.push({ id: 'recent', entries: recent });
  if (custom.length > 0) tabs.push({ id: 'custom', entries: custom });
  const byCategory = new Map<string, EmojiTab>();
  for (const item of emoji) {
    let tab = byCategory.get(item.category);
    if (!tab) {
      tab = { id: item.category, entries: [] };
      byCategory.set(item.category, tab);
      tabs.push(tab);
    }
    tab.entries.push({ kind: 'native', emoji: item });
  }
  return tabs;
}

/**
 * The emoji `load` returns, loaded once per `loadKey` through the latest `load`, so a host that
 * passes a new function on each render does not load again.
 */
function useEmojiData(load: EmojiLoader, loadKey: string): EmojiData {
  const latest = useLatest(load);
  const [result, setResult] = useState<EmojiData & { loadKey?: string }>({
    emoji: null,
    failed: false,
  });
  useEffect(() => {
    let current = true;
    // A loader that throws fails as one that rejects.
    Promise.resolve(callSettling(latest.current)).then(
      (emoji) => current && setResult({ loadKey, emoji, failed: false }),
      () => current && setResult({ loadKey, emoji: null, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [latest, loadKey]);
  return result.loadKey === loadKey ? result : { emoji: null, failed: false };
}

function useEmojiTabs(
  emoji: readonly NativeEmoji[] | null,
  { recentEmoji = noKeys, customEmoji = noCustomEmoji }: EmojiSources,
) {
  return useMemo(() => {
    const native = emoji ?? [];
    const custom = customEmoji.map((item): EmojiEntry => ({ kind: 'custom', emoji: item }));
    const recent = resolveEmojiKeys(recentEmoji, native, customEmoji);
    const all = [...custom, ...native.map((item): EmojiEntry => ({ kind: 'native', emoji: item }))];
    return { tabs: buildTabs(native, recent, custom), all };
  }, [emoji, recentEmoji, customEmoji]);
}

/** The search query and its best matches; every change is reported to `onSearchChange`. */
function useEmojiSearch(
  entries: readonly EmojiEntry[],
  onSearchChange: ((value: string) => void) | undefined,
): EmojiSearchState {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchEmoji(entries, query, searchLimit), [entries, query]);
  return {
    query,
    isSearching: query.trim() !== '',
    results,
    setQuery: (value) => {
      setQuery(value);
      onSearchChange?.(value);
    },
  };
}

/** Reports a chosen emoji and the updated recent list, then closes the trigger's popover, if any. */
function useChooseEmoji({
  tone,
  recentEmoji = noKeys,
  onSelect,
  onRecentEmojiChange,
}: ChooseEmojiOptions) {
  const dismiss = useContext(EmojiPickerDismissContext);
  return (entry: EmojiEntry) => {
    onSelect?.(toEmojiSelection(entry, tone));
    onRecentEmojiChange?.(addRecentEmoji(recentEmoji, getEmojiKey(entry), recentLimit));
    dismiss?.();
  };
}

/**
 * The standard emoji from `loadEmoji`, loaded once, or the bundled set in the React Aria locale's
 * language, loaded again when the locale changes.
 */
function useLocalizedEmojiData(loadEmoji: EmojiLoader | undefined): EmojiData {
  const emojiLocale = resolveEmojiLocale(useLocale().locale);
  return useEmojiData(
    loadEmoji ?? (() => loadEmojiData(emojiLocale)),
    loadEmoji ? 'caller' : `bundled:${emojiLocale}`,
  );
}

/**
 * The offered standard emoji: the loaded ones filtered by category, version and `filterEmoji`, and,
 * for text glyphs, by what the platform draws, measured in the picker's font.
 */
function useOfferedEmoji({
  loadEmoji,
  renderEmoji,
  categories,
  emojiVersion,
  filterEmoji,
  rootRef,
}: EmojiPickerStateOptions): EmojiData {
  const loaded = useLocalizedEmojiData(loadEmoji);
  const support = useEmojiSupport(rootRef, !renderEmoji);
  const emoji = useMemo(
    () =>
      loaded.emoji && support
        ? filterNativeEmoji(loaded.emoji, {
            categories,
            maxVersion: emojiVersion ?? support.version,
            hideCountryFlags: !support.countryFlags,
            filterEmoji,
          })
        : null,
    [loaded.emoji, support, categories, emojiVersion, filterEmoji],
  );
  return { emoji, failed: loaded.failed };
}

/** The state every part of a picker reads, from the picker's props. */
export function useEmojiPickerState(options: EmojiPickerStateOptions): EmojiPickerState {
  const data = useOfferedEmoji(options);
  const [tone, setTone] = useControllableState(
    options.skinTone,
    options.defaultSkinTone ?? 'default',
    options.onSkinToneChange,
  );
  const { tabs, all } = useEmojiTabs(data.emoji, options);
  const search = useEmojiSearch(all, options.onSearchChange);
  const choose = useChooseEmoji({ ...options, tone });
  const [tabId, setTabId] = useState<string>();
  const [activeEmoji] = useState(() => createValueStore<EmojiEntry | null>(null));
  const gridRef = useRef<HTMLDivElement>(null);
  const [isEntering, setEntering] = useState(false);
  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];
  // The body shows no emoji, custom ones included, while the standard ones load or failed to.
  const isShown = data.emoji !== null && !data.failed;
  const first = isShown ? (search.isSearching ? search.results[0] : tab?.entries[0]) : undefined;
  return {
    data,
    search,
    tabs,
    tab,
    setTabId,
    grid: {
      skinTone: tone,
      onSelect: choose,
      onActiveChange: activeEmoji.set,
      renderEmoji: options.renderEmoji,
      gridRef,
      virtualized: options.virtualized,
      focusOnEntry: isEntering ? 'first' : undefined,
      onEntered: () => setEntering(false),
    },
    gridRef,
    enterGrid: () => {
      if (gridRef.current) setEntering(true);
    },
    tone,
    setTone,
    activeEmoji,
    chooseFirst: () => (first ? choose(first) : undefined),
    autoFocus: options.autoFocus,
  };
}
