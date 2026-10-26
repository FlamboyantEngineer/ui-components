import type { KeyboardEvent, Ref } from 'react';
import type { ChosenSelectOption } from './select-options.js';
export interface SelectTriggerProps {
    ref: Ref<HTMLButtonElement>;
    /** The chosen option of a single select. A multiple select shows its choices as chips. */
    chosen: ChosenSelectOption | null;
    /** A multiple select's count of its choices (`2 selected`), shown in place of the placeholder. */
    summary: string | null;
    /** The committed option a single select's edit replaced, shown before the current one. */
    previous: ChosenSelectOption | null;
    placeholder: string;
    /** Names the clear button after the trigger; `null` draws none. */
    clearLabel: string | null;
    onClear: () => void;
    /** Handles keys before the select does, to open the filter from a printable key. */
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}
/**
 * The frame of a select field: the previous value while a single select is dirty, then the trigger
 * with the chosen option's icon and label (a multiple select's count, or the placeholder) and a
 * chevron, then the clear button. The value element is
 * the one React Aria names the trigger with, so the trigger reads as its value and the field's
 * label; the previous value stays outside the button, readable on its own.
 */
export declare function SelectTrigger({ ref, chosen, previous, placeholder, summary, clearLabel, onClear, onKeyDownCapture, }: SelectTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=select-trigger.d.ts.map