// AltGr typing, which browsers on Windows report with Control and Alt held.

/** What the test reads from a native key event. */
export type AltGraphKey = Pick<KeyboardEvent, 'key'> &
  Partial<Pick<KeyboardEvent, 'getModifierState'>>;

const latinLetterOrDigit = /^[a-z0-9]$/i;

/**
 * Whether a press is AltGr typing a character, which browsers on Windows also report as
 * Control+Alt: AltGraph is held and the key types something other than a Latin letter or digit,
 * which Control+Alt shortcuts keep.
 */
export function isAltGraphText(event: AltGraphKey): boolean {
  return (
    event.getModifierState?.('AltGraph') === true &&
    event.key.length === 1 &&
    !latinLetterOrDigit.test(event.key)
  );
}
