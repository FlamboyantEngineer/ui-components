// Hierarchical numbers for outlines, trees and documents (specs/OUTLINE-NUMBER.md).

/** How one level of an outline number is written. */
export type OutlineNumberStyle =
  | 'decimal'
  | 'lower-alpha'
  | 'upper-alpha'
  | 'lower-roman'
  | 'upper-roman';

export interface FormatOutlineNumberOptions {
  /** The style of each level from the top; the last one repeats for deeper levels. Defaults to `['decimal']`. */
  styles?: readonly OutlineNumberStyle[] | undefined;
  /** The number the first item of every level gets. Defaults to 1. */
  start?: number | undefined;
  /** Written between levels. Defaults to `.`. */
  separator?: string | undefined;
}

const romanDigits: ReadonlyArray<readonly [number, string]> = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

/** 1 → a, 26 → z, 27 → aa: letters as digits of a base-26 numbering with no zero. */
function toLetters(value: number): string {
  let rest = value;
  let letters = '';
  while (rest > 0) {
    const digit = (rest - 1) % 26;
    letters = String.fromCharCode(97 + digit) + letters;
    rest = Math.floor((rest - 1) / 26);
  }
  return letters;
}

function toRoman(value: number): string {
  let rest = value;
  let numeral = '';
  for (const [amount, digits] of romanDigits) {
    while (rest >= amount) {
      numeral += digits;
      rest -= amount;
    }
  }
  return numeral;
}

/** One level's number in its style; a value the style cannot write is written in decimal. */
function formatLevel(value: number, style: OutlineNumberStyle): string {
  if (style === 'lower-alpha' || style === 'upper-alpha') {
    if (value < 1) return String(value);
    const letters = toLetters(value);
    return style === 'upper-alpha' ? letters.toUpperCase() : letters;
  }
  if (style === 'lower-roman' || style === 'upper-roman') {
    if (value < 1 || value > 3999) return String(value);
    const numeral = toRoman(value);
    return style === 'upper-roman' ? numeral.toUpperCase() : numeral;
  }
  return String(value);
}

/**
 * The outline number of an item from its path: its zero-based position among its siblings at each
 * level, from the top (`[0, 1, 2]` → `1.2.3`). Each level is written in its style, starting at
 * `start`, and levels are joined with `separator`.
 */
export function formatOutlineNumber(
  path: readonly number[],
  { styles = ['decimal'], start = 1, separator = '.' }: FormatOutlineNumberOptions = {},
): string {
  return path
    .map((position, level) => {
      const style = styles[Math.min(level, styles.length - 1)] ?? 'decimal';
      return formatLevel(Math.trunc(start) + Math.max(0, Math.trunc(position)), style);
    })
    .join(separator);
}
