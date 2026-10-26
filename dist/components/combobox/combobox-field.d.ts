import { type RefCallback, type RefObject } from 'react';
import type { ControlSize } from '../../core/props.js';
import { type ComboboxChipsProps } from './combobox-chips.js';
import { type ComboboxCompletion, type ComboboxOption } from './combobox-options.js';
export interface ComboboxFieldProps {
    variant: 'default' | 'search';
    size: ControlSize;
    placeholder: string | undefined;
    isPending: boolean;
    /** Neither disabled nor read-only. */
    isEditable: boolean;
    /** A multiple combobox's label text and options, to show its chosen options as chips; else `null`. */
    chips: Pick<ComboboxChipsProps, 'label' | 'options'> | null;
    /** Inline completion, or `null` when off. */
    completion: InlineCompletion | null;
    /** The input element, for the combobox's own use, and the ref to put on it. */
    input: {
        ref: RefObject<HTMLInputElement | null>;
        setRef: RefCallback<HTMLInputElement>;
    };
}
/** What inline completion needs: the options it completes from and where it reports. */
export interface InlineCompletion {
    options: readonly ComboboxOption[];
    onComplete: (completion: ComboboxCompletion | null) => void;
}
/** The field group: chips, the search glyph, the input, the busy indicator and the buttons. */
export declare function ComboboxField({ variant, size, placeholder, isPending, isEditable, chips, completion, input, }: ComboboxFieldProps): import("react").JSX.Element;
/** Submits original keys while collection primitives use their encoded identities. */
export declare function ComboboxInputs({ name, isDisabled, isCustom, }: {
    name: string | undefined;
    isDisabled: boolean | undefined;
    isCustom: boolean | undefined;
}): import("react").JSX.Element[] | null;
//# sourceMappingURL=combobox-field.d.ts.map