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

/** What the browser says about an input event: its kind and the text it inserted. */
export interface PinInputEdit {
  inputType?: string | undefined;
  data?: string | null | undefined;
}

/**
 * The text a cell received. Typing (`insertText`, or an input method's composition) inserts its
 * `data` at the caret, beside the cell's old character when that was not selected, so only `data`
 * counts. Any other change, such as autofill or a replacement, sets the cell's whole text, so all of
 * it counts, even when it happens to hold the old character.
 */
export function readEnteredText(typed: string, edit: PinInputEdit): string {
  const isTyped = edit.inputType === 'insertText' || edit.inputType === 'insertCompositionText';
  return isTyped && edit.data ? edit.data : typed;
}

/** Whether `value` is a full code: exactly `length` characters, each one a cell of `type` takes. */
export function isPinCodeComplete(value: string, cells: { length: number; type: PinInputType }) {
  return value.length === cells.length && filterPinCharacters(value, cells.type) === value;
}

/** The cell that takes the next character: the first empty one, or the last once all are filled. */
export function findActivePinCell(value: string, length: number): number {
  return Math.max(0, Math.min(value.length, length - 1));
}
