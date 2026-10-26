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
export type ShortcutChord = string | {
    key: string;
    modifiers?: readonly ShortcutModifier[] | undefined;
};
/** Chords pressed one after another, such as `['G', 'I']` or `['Ctrl+K', 'Ctrl+C']`. */
export type ShortcutSequence = readonly ShortcutChord[];
/** The browser fields platform detection reads, most specific first. */
export interface ShortcutPlatformSource {
    userAgentData?: {
        platform?: string | undefined;
    } | undefined;
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
/**
 * Detects the platform from `source` (the browser's `navigator` by default): its client-hint
 * platform, then its legacy platform, then its user agent. Without a browser it reports `linux`.
 */
export declare function detectShortcutPlatform(source?: ShortcutPlatformSource | undefined): ShortcutPlatform;
/** The current browser's platform, detected on first use and then reused. */
export declare function getShortcutPlatform(): ShortcutPlatform;
/** The separator drawn between keycaps: none on macOS, `+` elsewhere. */
export declare function getShortcutKeySeparator(platform: ShortcutPlatform): string;
/**
 * The keycaps of a chord in display order: modifiers (Control, Alt/Option, Shift, Meta/Command,
 * each once) then the key. An empty key yields no keycaps.
 */
export declare function formatShortcutKeys(chord: ShortcutChord, platform?: ShortcutPlatform): string[];
/**
 * The steps of a chord or sequence that draw something, each as its keycaps: one step for a chord,
 * one per chord with a key for a sequence.
 */
export declare function formatShortcutSteps(chord: ShortcutChord | ShortcutSequence, platform?: ShortcutPlatform): string[][];
/** A chord as display text: `⇧⌘K` on macOS, `Ctrl+Shift+K` elsewhere; a sequence as `⌘K ⌘C`. */
export declare function formatShortcut(chord: ShortcutChord | ShortcutSequence, platform?: ShortcutPlatform): string;
/** A chord as readable words, such as `Shift Command K`; a sequence as `G, then I`. */
export declare function formatShortcutAccessibleText(chord: ShortcutChord | ShortcutSequence, { platform, keyName, sequence, }?: ShortcutTextOptions): string;
/**
 * A chord as an `aria-keyshortcuts` value for the platform: `Meta+Shift+K` on macOS,
 * `Control+Shift+K` elsewhere. An empty key yields empty text.
 */
export declare function formatAriaKeyShortcuts(chord: ShortcutChord, platform?: ShortcutPlatform): string;
/** Tooltip text with the chord after the label: `Save (⌘S)`. Without a chord, the label alone. */
export declare function formatShortcutTooltip(label: string | undefined, chord: ShortcutChord | ShortcutSequence | undefined, platform?: ShortcutPlatform): string | undefined;
/** An accessible description followed by the chord's readable words: `Opens the menu. Command K`. */
export declare function formatShortcutDescription(description: string | undefined, chord: ShortcutChord | ShortcutSequence | undefined, options?: ShortcutTextOptions): string | undefined;
//# sourceMappingURL=shortcut-format.d.ts.map