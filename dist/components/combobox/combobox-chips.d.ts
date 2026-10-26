import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { type TagGroupSize } from '../tag-group/tag-group.js';
import type { ComboboxOption } from './combobox-options.js';
export interface ComboboxChipsProps {
    /** The combobox's label text, which names the group of chips. */
    label: string;
    /** The options the suggestions list now, to label the chips. */
    options: readonly ComboboxOption[];
    size: TagGroupSize;
    /** Chips offer a remove button and answer Delete and Backspace. */
    isEditable: boolean;
}
export interface ChipsLabelOptions {
    /** The combobox's label. */
    label: ReactNode;
    /** The combobox's own naming. */
    aria: AriaLabellingProps;
    /** The combobox shows chips; otherwise nothing is read. */
    isEnabled: boolean;
}
/**
 * The text naming a multiple combobox, which names its chips, and the ref for its label element:
 * a text `label` or `aria-label` as given, else the text of the label element or of the elements
 * `aria-labelledby` names, read once they render, so a label drawn as markup or named elsewhere
 * still names the chips.
 */
export declare function useChipsLabel({ label, aria, isEnabled }: ChipsLabelOptions): {
    text: string;
    labelRef: import("react").RefObject<HTMLLabelElement | null>;
};
/**
 * A multiple combobox's chosen options as removable chips, each with its option's icon, in the
 * library's `TagGroup` before the input: the arrow keys move between chips, and the remove button, Delete or Backspace removes one.
 */
export declare function ComboboxChips({ label, options, size, isEditable }: ComboboxChipsProps): import("react").JSX.Element | null;
//# sourceMappingURL=combobox-chips.d.ts.map