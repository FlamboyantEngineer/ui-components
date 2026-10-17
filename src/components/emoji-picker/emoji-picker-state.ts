import { useEffect, useMemo, useState } from 'react';
import {
  resolveEmojiKeys,
  type CustomEmoji,
  type EmojiEntry,
  type NativeEmoji,
  type SkinTone,
} from './emoji-catalog.js';

export interface EmojiData {
  emoji: readonly NativeEmoji[] | null;
  failed: boolean;
}

export interface EmojiTab {
  id: string;
  entries: EmojiEntry[];
}

/** The skin tone as a controlled or uncontrolled value. */
export interface SkinToneState {
  /** The skin tone applied to emoji that take one (controlled). */
  skinTone?: SkinTone | undefined;
  /** The initial skin tone when uncontrolled. Defaults to `default`. */
  defaultSkinTone?: SkinTone | undefined;
  onSkinToneChange?: ((tone: SkinTone) => void) | undefined;
}

/** The emoji the host supplies besides the standard set. */
export interface EmojiSources {
  /** Recently used emoji, most recent first: standard glyphs and `:shortcode:` for custom emoji. */
  recentEmoji?: readonly string[] | undefined;
  /** Image emoji, shown under their own category and in search results. */
  customEmoji?: readonly CustomEmoji[] | undefined;
}

export function useEmojiData(loadEmoji: () => Promise<readonly NativeEmoji[]>): EmojiData {
  const [result, setResult] = useState<EmojiData & { loader?: typeof loadEmoji }>({
    emoji: null,
    failed: false,
  });
  useEffect(() => {
    let current = true;
    loadEmoji().then(
      (emoji) => current && setResult({ loader: loadEmoji, emoji, failed: false }),
      () => current && setResult({ loader: loadEmoji, emoji: null, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [loadEmoji]);
  return result.loader === loadEmoji ? result : { emoji: null, failed: false };
}

export function useSkinTone({
  skinTone,
  defaultSkinTone = 'default',
  onSkinToneChange,
}: SkinToneState) {
  const [own, setOwn] = useState(defaultSkinTone);
  const change = (tone: SkinTone) => {
    setOwn(tone);
    onSkinToneChange?.(tone);
  };
  return [skinTone ?? own, change] as const;
}

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

export function useEmojiTabs(
  emoji: readonly NativeEmoji[] | null,
  { recentEmoji = [], customEmoji = [] }: EmojiSources,
) {
  return useMemo(() => {
    const native = emoji ?? [];
    const custom = customEmoji.map((item): EmojiEntry => ({ kind: 'custom', emoji: item }));
    const recent = resolveEmojiKeys(recentEmoji, native, customEmoji);
    const all = [...custom, ...native.map((item): EmojiEntry => ({ kind: 'native', emoji: item }))];
    return { tabs: buildTabs(native, recent, custom), all };
  }, [emoji, recentEmoji, customEmoji]);
}
