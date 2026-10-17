// Keyboard chord formatting: one canonical chord, shown in the notation of the reader's platform.

import { defaultStrings } from '../../core/strings.js';

export type ShortcutPlatform = 'mac' | 'windows' | 'linux';

/**
 * `primary` is the platform's main command modifier: Command on macOS, Control elsewhere.
 * `control` is always the physical Control key.
 */
export type ShortcutModifier = 'primary' | 'control' | 'alt' | 'shift' | 'meta';

/**
 * A chord written as text (`Ctrl+Shift+K`, where `Ctrl` means the primary modifier and `Control`
 * the physical key) or as a key with its modifiers.
 */
export type ShortcutChord =
  | string
  | { key: string; modifiers?: readonly ShortcutModifier[] | undefined };

/** The browser fields platform detection reads, most specific first. */
export interface ShortcutPlatformSource {
  userAgentData?: { platform?: string | undefined } | undefined;
  platform?: string | undefined;
  userAgent?: string | undefined;
}

/** Turns a canonical key name into the text read to assistive technology. */
export type ShortcutKeyNamer = (key: string) => string;

type PhysicalModifier = Exclude<ShortcutModifier, 'primary'>;

const ALIASES: Readonly<Record<string, ShortcutModifier>> = {
  Ctrl: 'primary',
  Control: 'control',
  Alt: 'alt',
  Shift: 'shift',
  Meta: 'meta',
  Cmd: 'meta',
};
const MODIFIER_PREFIX = /^(Ctrl|Control|Alt|Shift|Meta|Cmd)\s*\+\s*/;
const ORDER: readonly PhysicalModifier[] = ['control', 'alt', 'shift', 'meta'];
const MAC = /mac|iphone|ipad|ipod/i;
const WINDOWS = /win/i;

const KEYCAPS: Readonly<Record<'mac' | 'other', Record<PhysicalModifier, string>>> = {
  mac: { control: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' },
  other: { control: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
};
const SPOKEN: Readonly<Record<'mac' | 'other', Record<PhysicalModifier, string>>> = {
  mac: { control: 'Control', alt: 'Option', shift: 'Shift', meta: 'Command' },
  other: { control: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
};

function browserSource(): ShortcutPlatformSource | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as ShortcutPlatformSource);
}

/**
 * Detects the platform from `source` (the browser's `navigator` by default): its client-hint
 * platform, then its legacy platform, then its user agent. Without a browser it reports `linux`.
 */
export function detectShortcutPlatform(
  source: ShortcutPlatformSource | undefined = browserSource(),
): ShortcutPlatform {
  const hint = source?.userAgentData?.platform || source?.platform || source?.userAgent || '';
  if (MAC.test(hint)) return 'mac';
  return WINDOWS.test(hint) ? 'windows' : 'linux';
}

let detected: ShortcutPlatform | undefined;

/** The current browser's platform, detected on first use and then reused. */
export function getShortcutPlatform(): ShortcutPlatform {
  detected ??= detectShortcutPlatform();
  return detected;
}

function parse(chord: ShortcutChord): { key: string; modifiers: readonly ShortcutModifier[] } {
  if (typeof chord !== 'string') return { key: chord.key, modifiers: chord.modifiers ?? [] };
  const modifiers: ShortcutModifier[] = [];
  let key = chord.trim();
  for (let match = MODIFIER_PREFIX.exec(key); match; match = MODIFIER_PREFIX.exec(key)) {
    const alias = ALIASES[match[1] ?? ''];
    if (alias) modifiers.push(alias);
    key = key.slice(match[0].length);
  }
  return { key, modifiers };
}

function resolve(chord: ShortcutChord, platform: ShortcutPlatform) {
  const { key, modifiers } = parse(chord);
  const held = new Set<PhysicalModifier>(
    modifiers.map((modifier) =>
      modifier === 'primary' ? (platform === 'mac' ? 'meta' : 'control') : modifier,
    ),
  );
  return { key, modifiers: ORDER.filter((modifier) => held.has(modifier)) };
}

/** The separator drawn between keycaps: none on macOS, `+` elsewhere. */
export function shortcutKeySeparator(platform: ShortcutPlatform): string {
  return platform === 'mac' ? '' : '+';
}

/**
 * The keycaps of a chord in display order: modifiers (Control, Alt/Option, Shift, Meta/Command,
 * each once) then the key. An empty key yields no keycaps.
 */
export function formatShortcutKeys(
  chord: ShortcutChord,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string[] {
  const { key, modifiers } = resolve(chord, platform);
  if (!key) return [];
  const names = KEYCAPS[platform === 'mac' ? 'mac' : 'other'];
  return [...modifiers.map((modifier) => names[modifier]), key];
}

/** A chord as display text: `⇧⌘K` on macOS, `Ctrl+Shift+K` elsewhere. */
export function formatShortcut(
  chord: ShortcutChord,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string {
  return formatShortcutKeys(chord, platform).join(shortcutKeySeparator(platform));
}

/** A chord as readable words, such as `Shift Command K`. */
export function formatShortcutAccessibleText(
  chord: ShortcutChord,
  platform: ShortcutPlatform = getShortcutPlatform(),
  keyName: ShortcutKeyNamer = defaultStrings.shortcutKeyName,
): string {
  const { key, modifiers } = resolve(chord, platform);
  if (!key) return '';
  const names = SPOKEN[platform === 'mac' ? 'mac' : 'other'];
  return [...modifiers.map((modifier) => names[modifier]), key].map(keyName).join(' ');
}

/** Tooltip text with the chord after the label: `Save (⌘S)`. Without a chord, the label alone. */
export function formatShortcutTooltip(
  label: string | undefined,
  chord: ShortcutChord | undefined,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string | undefined {
  const text = chord ? formatShortcut(chord, platform) : '';
  if (!text) return label;
  return label ? `${label} (${text})` : text;
}

/** An accessible description followed by the chord's readable words: `Opens the menu. Command K`. */
export function formatShortcutDescription(
  description: string | undefined,
  chord: ShortcutChord | undefined,
  platform: ShortcutPlatform = getShortcutPlatform(),
  keyName: ShortcutKeyNamer = defaultStrings.shortcutKeyName,
): string | undefined {
  if (!chord) return description;
  const text = [description, formatShortcutAccessibleText(chord, platform, keyName)]
    .filter(Boolean)
    .join('. ');
  return text || undefined;
}
