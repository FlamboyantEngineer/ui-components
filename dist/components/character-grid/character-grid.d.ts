import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type CharacterGridCategory, type CharacterGridCharacter } from './character-filter.js';
export type { CharacterGridCategory, CharacterGridCharacter } from './character-filter.js';
export interface CharacterGridProps extends BaseProps, AriaLabellingProps {
    /** The characters on offer, one section per category, in order. */
    categories: readonly CharacterGridCategory[];
    /** Called with the character the reader chooses. */
    onSelect: (character: CharacterGridCharacter) => void;
    /** Keeps the recently chosen characters in the provider's storage under this key. */
    persistKey?: string | undefined;
    /** Focuses the search field when the grid mounts. */
    autoFocus?: boolean | undefined;
}
/**
 * A searchable grid of characters, such as symbols to insert, grouped in the caller's categories:
 * one React Aria grid list whose sections are headed by category, moved through with the arrow keys
 * in two dimensions. The search matches names and code points, the recently chosen characters lead
 * the grid (kept through the provider's storage), and a preview names the hovered or focused one.
 */
export declare function CharacterGrid({ categories, onSelect, persistKey, autoFocus, className, id, ...rest }: CharacterGridProps): import("react").JSX.Element;
//# sourceMappingURL=character-grid.d.ts.map