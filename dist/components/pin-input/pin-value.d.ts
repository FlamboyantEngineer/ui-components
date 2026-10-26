/** The characters a cell takes: digits, letters, or both. */
export type PinInputType = 'numeric' | 'alphanumeric' | 'alphabetic';
/** The characters of `text` a cell of this type takes, in order; the others are dropped. */
export declare function filterPinCharacters(text: string, type: PinInputType): string;
/**
 * Writes `characters` over the value from cell `index` on, keeping the characters after them, and
 * cuts the result to `length` characters.
 */
export declare function writePinCharacters(value: string, write: {
    index: number;
    characters: string;
    length: number;
}): string;
/**
 * The text a cell received. Typing into a filled cell whose character is not selected leaves the
 * old character beside the new one, so only the new one counts; longer text (an autofilled code)
 * counts whole.
 */
export declare function readEnteredText(typed: string, previous: string): string;
/** The cell that takes the next character: the first empty one, or the last once all are filled. */
export declare function findActivePinCell(value: string, length: number): number;
//# sourceMappingURL=pin-value.d.ts.map