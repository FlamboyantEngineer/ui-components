// Matching key presses against a canonical chord, for components that act on a shortcut.

import { formatAriaKeyShortcuts, type ShortcutChord } from './shortcut-format.js';

/** What matching reads from a native key event. */
export type ChordKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'
>;

/** Keys `aria-keyshortcuts` names differently from a keyboard event's `key`. */
const eventKeyNames: Readonly<Record<string, string>> = { ' ': 'Space', '+': 'Plus' };
const letterOrDigit = /^[a-z0-9]$/i;
const letterOrDigitCode = /^(?:Key([A-Z])|Digit([0-9]))$/;

/**
 * The key a press names. A letter or digit key that Shift, Alt (Option) or the layout turned into
 * another character (`!` for Shift+1, `π` for Option+P) is read from its physical key instead.
 */
function readKey(event: Pick<KeyboardEvent, 'key' | 'code'>): string {
  if (letterOrDigit.test(event.key)) return event.key.toUpperCase();
  const physical = letterOrDigitCode.exec(event.code ?? '');
  if (physical) return physical[1] ?? physical[2] ?? '';
  return eventKeyNames[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
}

/** A key press in `aria-keyshortcuts` form: held modifiers in a fixed order, then the key. */
function describeKeyPress(event: ChordKeyEvent) {
  const key = readKey(event);
  const held = [
    event.ctrlKey ? 'Control' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
  ];
  return [...held.filter(Boolean), key].join('+');
}

/**
 * Whether a key press is exactly the chord on this platform (`Ctrl` is Command on macOS), with no
 * other modifier held.
 */
export function matchesChord(event: ChordKeyEvent, chord: ShortcutChord): boolean {
  const keys = formatAriaKeyShortcuts(chord);
  return keys !== '' && describeKeyPress(event) === keys;
}

/** Whether a key press is exactly the chord; repeats and text composition never match. */
export function isChordPress(event: KeyboardEvent, chord: ShortcutChord): boolean {
  if (event.repeat || event.isComposing) return false;
  return matchesChord(event, chord);
}
