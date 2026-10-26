import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ShortcutChord, type ShortcutPlatform, type ShortcutSequence } from './shortcut-format.js';
export interface ShortcutProps extends BaseProps {
    /**
     * The chord, such as `Ctrl+Shift+K` (`Ctrl` is Command on macOS) or `{ key, modifiers }`, or a
     * sequence of chords pressed one after another, such as `['G', 'I']`.
     */
    chord: ShortcutChord | ShortcutSequence;
    /** The notation to draw. Defaults to the detected platform; set it for deterministic output. */
    platform?: ShortcutPlatform | undefined;
    /** Draw only the keycaps, for a control that already describes the chord. */
    decorative?: boolean | undefined;
}
/** One entry of a key legend: the keys, then what they do. */
export interface KeyHint {
    /** The chords or sequences that trigger the action, drawn side by side. */
    keys: readonly (ShortcutChord | ShortcutSequence)[];
    /** What the keys do. */
    action: ReactNode;
}
export interface KeyHintsProps extends BaseProps {
    /** The legend's entries, in order. */
    hints: readonly KeyHint[];
    /** The notation of every shortcut. Defaults to the detected platform. */
    platform?: ShortcutPlatform | undefined;
}
/** The detected platform: the server's notation while hydrating, the browser's once hydrated. */
export declare function useDetectedPlatform(): ShortcutPlatform;
/**
 * A keyboard chord or key sequence in the reader's platform notation, with readable text for
 * assistive technology.
 */
export declare function Shortcut({ chord, platform, decorative, className, ...rest }: ShortcutProps): import("react").JSX.Element | null;
/** A key legend such as `↑↓ move · Enter select`, drawn on one metadata line. */
export declare function KeyHints({ hints, platform, className, ...rest }: KeyHintsProps): import("react").JSX.Element;
export { formatAriaKeyShortcuts } from './shortcut-format.js';
export type { ShortcutChord, ShortcutPlatform } from './shortcut-format.js';
//# sourceMappingURL=shortcut.d.ts.map