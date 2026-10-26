import { type RefObject } from 'react';
import { type ComboboxCompletion } from './combobox-options.js';
export interface AutoHighlightOptions {
    /** Highlight the first enabled option whenever the list is open and nothing is highlighted. */
    autoHighlight: boolean;
    /** The inline completion, whose option is highlighted while the input shows it. */
    completion: ComboboxCompletion | null;
}
/**
 * Keeps an option highlighted while the list is open, so Enter picks it: the completing option,
 * else, with `autoHighlight`, the first enabled one. React Aria clears the highlight when the text
 * changes, after this hook's effect, so the effect runs after every render and restores it.
 */
export declare function useAutoHighlight({ autoHighlight, completion }: AutoHighlightOptions): void;
/**
 * Shows the text of an option the add row created once the caller selects it. React Aria builds
 * the new option into its collection a render after the selection, and leaves the text of a focused
 * input alone, so the input would stay empty; reverting once the option exists writes its label and
 * closes the list as a pick does. Opening the list again drops the pending option.
 */
export declare function useCreatedSelection(createdRef: RefObject<string | null>): void;
/**
 * Holds React Aria's list open or closed as the combobox's open state says. The building block keeps
 * its own open state, so a controlled `isOpen` the reader's action did not change puts it back;
 * closing commits the text as Escape does.
 */
export declare function useOpenState(isOpen: boolean): void;
//# sourceMappingURL=combobox-effects.d.ts.map