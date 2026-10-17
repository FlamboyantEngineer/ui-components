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

/** Chords pressed one after another, such as `['G', 'I']` or `['Ctrl+K', 'Ctrl+C']`. */
export type ShortcutSequence = readonly ShortcutChord[];

/** The browser fields platform detection reads, most specific first. */
export interface ShortcutPlatformSource {
  userAgentData?: { platform?: string | undefined } | undefined;
  platform?: string | undefined;
  userAgent?: string | undefined;
}

/** Turns a canonical key name into the text read to assistive technology. */
export type ShortcutKeyNamer = (key: string) => string;

/** How a chord becomes readable words. */
export interface ShortcutTextOptions {
  /** The notation. Defaults to the detected platform. */
  platform?: ShortcutPlatform | undefined;
  /** Names each key. Defaults to the built-in English key names. */
  keyName?: ShortcutKeyNamer | undefined;
  /** Joins the readable chords of a sequence. Defaults to the built-in English `G, then I`. */
  sequence?: ((steps: readonly string[]) => string) | undefined;
}

type PhysicalModifier = Exclude<ShortcutModifier, 'primary'>;

const aliases: Readonly<Record<string, ShortcutModifier>> = {
  Ctrl: 'primary',
  Control: 'control',
  Alt: 'alt',
  Shift: 'shift',
  Meta: 'meta',
  Cmd: 'meta',
};
const modifierPrefix = /^(Ctrl|Control|Alt|Shift|Meta|Cmd)\s*\+\s*/;
const modifierOrder: readonly PhysicalModifier[] = ['control', 'alt', 'shift', 'meta'];
const macPlatform = /mac|iphone|ipad|ipod/i;
const windowsPlatform = /win/i;

const keycaps: Readonly<Record<'mac' | 'other', Record<PhysicalModifier, string>>> = {
  mac: { control: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' },
  other: { control: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
};
const spokenModifiers: Readonly<Record<'mac' | 'other', Record<PhysicalModifier, string>>> = {
  mac: { control: 'Control', alt: 'Option', shift: 'Shift', meta: 'Command' },
  other: { control: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
};

/** Modifier names in `aria-keyshortcuts`, which follow the keyboard event key values. */
const ariaModifiers: Readonly<Record<PhysicalModifier, string>> = {
  control: 'Control',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
};
/** Keys `aria-keyshortcuts` names differently from how a chord writes them. */
const ariaKeys: Readonly<Record<string, string>> = {
  '+': 'Plus',
  ' ': 'Space',
  '↑': 'ArrowUp',
  '↓': 'ArrowDown',
  '←': 'ArrowLeft',
  '→': 'ArrowRight',
};

let detected: ShortcutPlatform | undefined;

function getBrowserSource(): ShortcutPlatformSource | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as ShortcutPlatformSource);
}

function isSequence(chord: ShortcutChord | ShortcutSequence): chord is ShortcutSequence {
  return Array.isArray(chord);
}

function parseChord(chord: ShortcutChord): { key: string; modifiers: readonly ShortcutModifier[] } {
  if (typeof chord !== 'string') return { key: chord.key, modifiers: chord.modifiers ?? [] };
  const modifiers: ShortcutModifier[] = [];
  let key = chord.trim();
  for (let match = modifierPrefix.exec(key); match; match = modifierPrefix.exec(key)) {
    const alias = aliases[match[1] ?? ''];
    if (alias) modifiers.push(alias);
    key = key.slice(match[0].length);
  }
  return { key, modifiers };
}

function resolveChord(chord: ShortcutChord, platform: ShortcutPlatform) {
  const { key, modifiers } = parseChord(chord);
  const held = new Set<PhysicalModifier>(
    modifiers.map((modifier) =>
      modifier === 'primary' ? (platform === 'mac' ? 'meta' : 'control') : modifier,
    ),
  );
  return { key, modifiers: modifierOrder.filter((modifier) => held.has(modifier)) };
}

/**
 * Detects the platform from `source` (the browser's `navigator` by default): its client-hint
 * platform, then its legacy platform, then its user agent. Without a browser it reports `linux`.
 */
export function detectShortcutPlatform(
  source: ShortcutPlatformSource | undefined = getBrowserSource(),
): ShortcutPlatform {
  const hint = source?.userAgentData?.platform || source?.platform || source?.userAgent || '';
  if (macPlatform.test(hint)) return 'mac';
  return windowsPlatform.test(hint) ? 'windows' : 'linux';
}

/** The current browser's platform, detected on first use and then reused. */
export function getShortcutPlatform(): ShortcutPlatform {
  detected ??= detectShortcutPlatform();
  return detected;
}

/** The separator drawn between keycaps: none on macOS, `+` elsewhere. */
export function getShortcutKeySeparator(platform: ShortcutPlatform): string {
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
  const { key, modifiers } = resolveChord(chord, platform);
  if (!key) return [];
  const names = keycaps[platform === 'mac' ? 'mac' : 'other'];
  return [...modifiers.map((modifier) => names[modifier]), key];
}

/**
 * The steps of a chord or sequence that draw something, each as its keycaps: one step for a chord,
 * one per chord with a key for a sequence.
 */
export function formatShortcutSteps(
  chord: ShortcutChord | ShortcutSequence,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string[][] {
  const steps = isSequence(chord) ? chord : [chord];
  return steps.map((step) => formatShortcutKeys(step, platform)).filter((keys) => keys.length > 0);
}

/** A chord as display text: `⇧⌘K` on macOS, `Ctrl+Shift+K` elsewhere; a sequence as `⌘K ⌘C`. */
export function formatShortcut(
  chord: ShortcutChord | ShortcutSequence,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string {
  const separator = getShortcutKeySeparator(platform);
  return formatShortcutSteps(chord, platform)
    .map((keys) => keys.join(separator))
    .join(' ');
}

/** A chord as readable words, such as `Shift Command K`; a sequence as `G, then I`. */
export function formatShortcutAccessibleText(
  chord: ShortcutChord | ShortcutSequence,
  {
    platform = getShortcutPlatform(),
    keyName = defaultStrings.shortcutKeyName,
    sequence = defaultStrings.shortcutSequence,
  }: ShortcutTextOptions = {},
): string {
  const names = spokenModifiers[platform === 'mac' ? 'mac' : 'other'];
  const steps = (isSequence(chord) ? chord : [chord]).flatMap((step) => {
    const { key, modifiers } = resolveChord(step, platform);
    if (!key) return [];
    return [[...modifiers.map((modifier) => names[modifier]), key].map(keyName).join(' ')];
  });
  return steps.length > 1 ? sequence(steps) : (steps[0] ?? '');
}

/**
 * A chord as an `aria-keyshortcuts` value for the platform: `Meta+Shift+K` on macOS,
 * `Control+Shift+K` elsewhere. An empty key yields empty text.
 */
export function formatAriaKeyShortcuts(
  chord: ShortcutChord,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string {
  const { key, modifiers } = resolveChord(chord, platform);
  if (!key) return '';
  const name = ariaKeys[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  return [...modifiers.map((modifier) => ariaModifiers[modifier]), name].join('+');
}

/** Tooltip text with the chord after the label: `Save (⌘S)`. Without a chord, the label alone. */
export function formatShortcutTooltip(
  label: string | undefined,
  chord: ShortcutChord | ShortcutSequence | undefined,
  platform: ShortcutPlatform = getShortcutPlatform(),
): string | undefined {
  const text = chord ? formatShortcut(chord, platform) : '';
  if (!text) return label;
  return label ? `${label} (${text})` : text;
}

/** An accessible description followed by the chord's readable words: `Opens the menu. Command K`. */
export function formatShortcutDescription(
  description: string | undefined,
  chord: ShortcutChord | ShortcutSequence | undefined,
  options: ShortcutTextOptions = {},
): string | undefined {
  if (!chord) return description;
  const text = [description, formatShortcutAccessibleText(chord, options)]
    .filter(Boolean)
    .join('. ');
  return text || undefined;
}
