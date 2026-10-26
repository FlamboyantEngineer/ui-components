import { useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { OverlayTriggerStateContext, useLocale } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useLatest } from '../../utils/use-latest.js';
import { createValueStore } from '../../utils/value-store.js';
import { addRecentEmoji, getEmojiKey, resolveEmojiKeys, searchEmoji, toEmojiSelection, } from './emoji-catalog.js';
import { filterNativeEmoji } from './emoji-filter.js';
import { loadEmojiData, resolveEmojiLocale } from './emoji-locale.js';
import { useEmojiSupport } from './emoji-support.js';
const searchLimit = 60;
const recentLimit = 24;
const noKeys = [];
const noCustomEmoji = [];
function buildTabs(emoji, recent, custom) {
    const tabs = [];
    if (recent.length > 0)
        tabs.push({ id: 'recent', entries: recent });
    if (custom.length > 0)
        tabs.push({ id: 'custom', entries: custom });
    const byCategory = new Map();
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
export function useEmojiData(load, loadKey) {
    const latest = useLatest(load);
    const [result, setResult] = useState({
        emoji: null,
        failed: false,
    });
    useEffect(() => {
        let current = true;
        latest.current().then((emoji) => current && setResult({ loadKey, emoji, failed: false }), () => current && setResult({ loadKey, emoji: null, failed: true }));
        return () => {
            current = false;
        };
    }, [latest, loadKey]);
    return result.loadKey === loadKey ? result : { emoji: null, failed: false };
}
export function useEmojiTabs(emoji, { recentEmoji = noKeys, customEmoji = noCustomEmoji }) {
    return useMemo(() => {
        const native = emoji ?? [];
        const custom = customEmoji.map((item) => ({ kind: 'custom', emoji: item }));
        const recent = resolveEmojiKeys(recentEmoji, native, customEmoji);
        const all = [...custom, ...native.map((item) => ({ kind: 'native', emoji: item }))];
        return { tabs: buildTabs(native, recent, custom), all };
    }, [emoji, recentEmoji, customEmoji]);
}
/** The search query and its best matches; every change is reported to `onSearchChange`. */
export function useEmojiSearch(entries, onSearchChange) {
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
/** Reports a chosen emoji and the updated recent list, then closes the overlay around the picker. */
export function useChooseEmoji({ tone, recentEmoji = noKeys, onSelect, onRecentEmojiChange, }) {
    const overlay = useContext(OverlayTriggerStateContext);
    return (entry) => {
        onSelect?.(toEmojiSelection(entry, tone));
        onRecentEmojiChange?.(addRecentEmoji(recentEmoji, getEmojiKey(entry), recentLimit));
        overlay?.close();
    };
}
/**
 * The standard emoji from `loadEmoji`, loaded once, or the bundled set in the React Aria locale's
 * language, loaded again when the locale changes.
 */
function useLocalizedEmojiData(loadEmoji) {
    const emojiLocale = resolveEmojiLocale(useLocale().locale);
    return useEmojiData(loadEmoji ?? (() => loadEmojiData(emojiLocale)), loadEmoji ? 'caller' : `bundled:${emojiLocale}`);
}
/**
 * The offered standard emoji: the loaded ones filtered by category, version and `filterEmoji`, and,
 * for text glyphs, by what the platform draws, measured in the picker's font.
 */
function useOfferedEmoji({ loadEmoji, renderEmoji, categories, emojiVersion, filterEmoji, rootRef, }) {
    const loaded = useLocalizedEmojiData(loadEmoji);
    const support = useEmojiSupport(rootRef, !renderEmoji);
    const emoji = useMemo(() => loaded.emoji && support
        ? filterNativeEmoji(loaded.emoji, {
            categories,
            maxVersion: emojiVersion ?? support.version,
            hideCountryFlags: !support.countryFlags,
            filterEmoji,
        })
        : null, [loaded.emoji, support, categories, emojiVersion, filterEmoji]);
    return { emoji, failed: loaded.failed };
}
/** The state every part of a picker reads, from the picker's props. */
export function useEmojiPickerState(options) {
    const data = useOfferedEmoji(options);
    const [tone, setTone] = useControllableState(options.skinTone, options.defaultSkinTone ?? 'default', options.onSkinToneChange);
    const { tabs, all } = useEmojiTabs(data.emoji, options);
    const search = useEmojiSearch(all, options.onSearchChange);
    const choose = useChooseEmoji({ ...options, tone });
    const [tabId, setTabId] = useState();
    const [activeEmoji] = useState(() => createValueStore(null));
    const gridRef = useRef(null);
    const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];
    const first = search.isSearching ? search.results[0] : tab?.entries[0];
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
        },
        gridRef,
        tone,
        setTone,
        activeEmoji,
        chooseFirst: () => (first ? choose(first) : undefined),
        autoFocus: options.autoFocus,
    };
}
//# sourceMappingURL=emoji-picker-state.js.map