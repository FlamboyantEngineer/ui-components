import type { Key } from '../../core/props.js';
import type { ChosenSelectOption } from './select-options.js';
export interface SelectChipsProps {
    /** The field's label, which names the group of chips. */
    label: string;
    /** The chosen options, one chip each. */
    chosen: readonly ChosenSelectOption[];
    /** Keys the edit added to the committed value; their chips publish `data-change="added"`. */
    added: ReadonlySet<Key>;
    /** Committed options the edit removed, each shown as a previous value with a restore button. */
    removed: readonly ChosenSelectOption[];
    /** Chips offer a remove button and answer Delete and Backspace. */
    isEditable: boolean;
    /** The select holds its `maxValues`: removed values cannot be put back. */
    isFull: boolean;
    onRemove: (keys: Set<Key>) => void;
    onRestore: (key: Key) => void;
}
/**
 * A multiple select's choices as removable chips in a React Aria tag group (arrow keys move between
 * chips, Delete and Backspace remove one), followed by the committed values the edit removed, each
 * with a button that puts it back.
 */
export declare function SelectChips({ label, chosen, added, removed, isEditable, isFull, onRemove, onRestore, }: SelectChipsProps): import("react").JSX.Element;
//# sourceMappingURL=select-chips.d.ts.map