// Matching key presses against a canonical chord, for the palette's document-wide shortcut.

import { useEffect, useLayoutEffect, useRef } from 'react';
import { formatAriaKeyShortcuts, type ShortcutChord } from '../shortcut/shortcut.js';

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
function describeKeyPress(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>,
) {
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
 * other modifier held. Repeats and text composition never match.
 */
export function isChordPress(event: KeyboardEvent, chord: ShortcutChord): boolean {
  if (event.repeat || event.isComposing) return false;
  const keys = formatAriaKeyShortcuts(chord);
  return keys !== '' && describeKeyPress(event) === keys;
}

/**
 * Calls `onPress` when the chord is pressed anywhere in the document and no one handled the key
 * press first. `null` registers nothing. The listener lives as long as the caller is mounted.
 */
export function useDocumentShortcut(chord: ShortcutChord | null, onPress: () => void): void {
  const keys = chord ? formatAriaKeyShortcuts(chord) : '';
  const latest = useRef({ chord, onPress });
  useLayoutEffect(() => {
    latest.current = { chord, onPress };
  });
  useEffect(() => {
    if (!keys) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const current = latest.current;
      if (event.defaultPrevented || !current.chord || !isChordPress(event, current.chord)) return;
      event.preventDefault();
      current.onPress();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [keys]);
}
