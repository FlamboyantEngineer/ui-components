// Matching key presses against a canonical chord, for components that act on a shortcut.

import { formatAriaKeyShortcuts, type ShortcutChord } from './shortcut-format.js';

/** What matching reads from a native key event. */
type ChordKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'
> &
  Partial<Pick<KeyboardEvent, 'getModifierState'>>;

/** Keys `aria-keyshortcuts` names differently from a keyboard event's `key`. */
const eventKeyNames: Readonly<Record<string, string>> = { ' ': 'Space', '+': 'Plus' };
const latinLetterOrDigit = /^[a-z0-9]$/i;
const letterOrDigitCode = /^(?:Key([A-Z])|Digit([0-9]))$/;

/**
 * The keys a press names: the key it types, upper-cased, and, when that is not a Latin letter or
 * digit, also the letter or digit key in its place on a US layout (its `code`). So `!` for Shift+1,
 * `π` for Option+P and `я` on a Cyrillic layout match the chord of their physical key too, and `я`
 * matches its own chord; a Latin letter that a layout moved (`q` on the A key) is only itself.
 */
function readKeys(event: Pick<KeyboardEvent, 'key' | 'code'>): string[] {
  const typed =
    eventKeyNames[event.key] ?? (event.key.length === 1 ? event.key.toUpperCase() : event.key);
  if (latinLetterOrDigit.test(event.key)) return [typed];
  const physical = letterOrDigitCode.exec(event.code ?? '');
  const placed = physical ? (physical[1] ?? physical[2]) : undefined;
  return placed && placed !== typed ? [typed, placed] : [typed];
}

/**
 * Whether a press is AltGr typing a character, which browsers on Windows also report as
 * Control+Alt: AltGraph is held and the key types something other than a Latin letter or digit.
 */
function isAltGraphText(event: ChordKeyEvent): boolean {
  return (
    event.getModifierState?.('AltGraph') === true &&
    event.key.length === 1 &&
    !latinLetterOrDigit.test(event.key)
  );
}

/** A key press in `aria-keyshortcuts` form for each key it names: held modifiers, then the key. */
function describeKeyPress(event: ChordKeyEvent): string[] {
  const held = [
    event.ctrlKey ? 'Control' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
  ].filter(Boolean);
  return readKeys(event).map((key) => [...held, key].join('+'));
}

/**
 * Whether a key press is exactly the chord on this platform (`Ctrl` is Command on macOS), with no
 * other modifier held. AltGr typing a character is text entry, never a chord.
 */
export function matchesChord(event: ChordKeyEvent, chord: ShortcutChord): boolean {
  const keys = formatAriaKeyShortcuts(chord);
  if (keys === '' || isAltGraphText(event)) return false;
  return describeKeyPress(event).includes(keys);
}

/** Whether a key press is exactly the chord; repeats and text composition never match. */
export function isChordPress(event: KeyboardEvent, chord: ShortcutChord): boolean {
  if (event.repeat || event.isComposing) return false;
  return matchesChord(event, chord);
}
