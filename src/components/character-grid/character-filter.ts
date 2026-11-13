// Searching a character grid's categories, and naming a character's code points.

import { splitMatchTerms, textMatchesTerms } from '../text-match/match-ranges.js';

/** A character a grid offers. */
export interface CharacterGridCharacter {
  /** The character, or a short sequence, chosen from its cell. Unique within its category. */
  char: string;
  /** Its name: the cell's accessible name and the text a search matches. */
  name: string;
}

/** A titled set of characters, shown as one section of the grid. */
export interface CharacterGridCategory {
  /** Unique among the categories. */
  id: string;
  /** The section's heading. */
  label: string;
  characters: readonly CharacterGridCharacter[];
}

const codePointQuery = /^u\+?([0-9a-f]{1,6})$/i;

/** The code points of `char` in Unicode notation, such as `U+00A9`, separated by spaces. */
export function formatCodePoints(char: string): string {
  return Array.from(char, (unit) => {
    const hex = (unit.codePointAt(0) ?? 0).toString(16).toUpperCase();
    return `U+${hex.padStart(4, '0')}`;
  }).join(' ');
}

/**
 * Whether a character matches a search: its name holds every term of `query` (ignoring case and
 * accents), or `query` is the character itself or its code point (`U+00B0`, `u+b0`). The terms and
 * code point are read once per query, not once per character.
 */
function createCharacterMatch(query: string): (character: CharacterGridCharacter) => boolean {
  const code = codePointQuery.exec(query)?.[1];
  const codePoint = code === undefined ? undefined : Number.parseInt(code, 16);
  const terms = splitMatchTerms(query, { ignoreAccents: true });
  return (character) => {
    if (query === character.char) return true;
    if (
      codePoint !== undefined &&
      Array.from(character.char).length === 1 &&
      character.char.codePointAt(0) === codePoint
    )
      return true;
    return textMatchesTerms(character.name, terms, { ignoreAccents: true });
  };
}

/**
 * The categories holding the characters that match `query`, each with only its matches; categories
 * without a match are left out. A blank query keeps every category whole.
 */
export function filterCharacterCategories(
  categories: readonly CharacterGridCategory[],
  query: string,
): CharacterGridCategory[] {
  const trimmed = query.trim();
  if (trimmed === '') return [...categories];
  const matches = createCharacterMatch(trimmed);
  return categories.flatMap((category) => {
    const characters = category.characters.filter(matches);
    return characters.length > 0 ? [{ ...category, characters }] : [];
  });
}
