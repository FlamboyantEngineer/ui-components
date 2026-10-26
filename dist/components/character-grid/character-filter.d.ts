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
/** The code points of `char` in Unicode notation, such as `U+00A9`, separated by spaces. */
export declare function formatCodePoints(char: string): string;
/**
 * The categories holding the characters that match `query`, each with only its matches; categories
 * without a match are left out. A blank query keeps every category whole.
 */
export declare function filterCharacterCategories(categories: readonly CharacterGridCategory[], query: string): CharacterGridCategory[];
//# sourceMappingURL=character-filter.d.ts.map