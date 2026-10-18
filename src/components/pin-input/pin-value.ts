// A code's value as its cells see it: which characters a cell takes and how typing changes it.

/** The characters a cell takes: digits, letters, or both. */
export type PinInputType = 'numeric' | 'alphanumeric' | 'alphabetic';

const patterns: Record<PinInputType, RegExp> = {
  numeric: /^[0-9]$/,
  alphanumeric: /^[a-z0-9]$/i,
  alphabetic: /^[a-z]$/i,
};

/** The characters of `text` a cell of this type takes, in order; the others are dropped. */
export function filterPinCharacters(text: string, type: PinInputType): string {
  return [...text].filter((character) => patterns[type].test(character)).join('');
}

/**
 * Writes `characters` over the value from cell `index` on, keeping the characters after them, and
 * cuts the result to `length` characters.
 */
export function writePinCharacters(
  value: string,
  write: { index: number; characters: string; length: number },
): string {
  const { index, characters, length } = write;
  return (value.slice(0, index) + characters + value.slice(index + characters.length)).slice(
    0,
    length,
  );
}

/**
 * The text a cell received. Typing into a filled cell whose character is not selected leaves the
 * old character beside the new one, so only the new one counts; longer text (an autofilled code)
 * counts whole.
 */
export function readEnteredText(typed: string, previous: string): string {
  if (previous === '' || typed.length !== 2) return typed;
  return typed.startsWith(previous) ? typed.slice(1) : typed.slice(0, 1);
}

/** The cell that takes the next character: the first empty one, or the last once all are filled. */
export function findActivePinCell(value: string, length: number): number {
  return Math.max(0, Math.min(value.length, length - 1));
}
