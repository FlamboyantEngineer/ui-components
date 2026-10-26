import { type ShortcutChord } from '../shortcut/shortcut.js';
/**
 * Whether a key press is exactly the chord on this platform (`Ctrl` is Command on macOS), with no
 * other modifier held. Repeats and text composition never match.
 */
export declare function isChordPress(event: KeyboardEvent, chord: ShortcutChord): boolean;
/**
 * Calls `onPress` when the chord is pressed anywhere in the document and no one handled the key
 * press first. `null` registers nothing. The listener lives as long as the caller is mounted.
 */
export declare function useDocumentShortcut(chord: ShortcutChord | null, onPress: () => void): void;
//# sourceMappingURL=command-palette-shortcut.d.ts.map