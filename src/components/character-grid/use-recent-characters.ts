import { usePersistentState } from '../../core/provider.js';
import type { CharacterGridCategory, CharacterGridCharacter } from './character-filter.js';

/** The characters chosen last, most recent first, and how to record a choice. */
interface RecentCharacters {
  characters: CharacterGridCharacter[];
  remember: (character: CharacterGridCharacter) => void;
}

/** How many recent characters a grid keeps. */
const recentLimit = 16;

/**
 * The characters chosen last, kept through the provider's storage under `persistKey` (or for the
 * component's lifetime without one) as a list of characters. A stored character no category still
 * offers is left out.
 */
export function useRecentCharacters(
  persistKey: string | undefined,
  categories: readonly CharacterGridCategory[],
): RecentCharacters {
  const [stored, setStored] = usePersistentState<string[]>(persistKey, []);
  const known = new Map<string, CharacterGridCharacter>();
  for (const character of categories.flatMap((category) => category.characters)) {
    if (!known.has(character.char)) known.set(character.char, character);
  }
  const chars = Array.isArray(stored) ? stored : [];
  return {
    characters: chars.flatMap((char) => known.get(char) ?? []),
    remember: (character) =>
      setStored((previous) =>
        [character.char, ...(Array.isArray(previous) ? previous : [])]
          .filter((char, index, all) => all.indexOf(char) === index)
          .slice(0, recentLimit),
      ),
  };
}
