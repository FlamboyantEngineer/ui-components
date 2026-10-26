import type { CharacterGridCategory, CharacterGridCharacter } from './character-filter.js';
/** The characters chosen last, most recent first, and how to record a choice. */
export interface RecentCharacters {
    characters: CharacterGridCharacter[];
    remember: (character: CharacterGridCharacter) => void;
}
/**
 * The characters chosen last, kept through the provider's storage under `persistKey` (or for the
 * component's lifetime without one) as a list of characters. A stored character no category still
 * offers is left out.
 */
export declare function useRecentCharacters(persistKey: string | undefined, categories: readonly CharacterGridCategory[]): RecentCharacters;
//# sourceMappingURL=use-recent-characters.d.ts.map