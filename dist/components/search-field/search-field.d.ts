import { type ReactNode, type RefObject } from 'react';
import type { FocusEventProps, KeyboardEventProps } from '../../core/events.js';
import type { BaseProps, Size } from '../../core/props.js';
import type { FieldLabelLayout, FieldTextInputProps, FieldValidationBehavior } from '../field/field.js';
export type SearchFieldSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** Where a search box's label sits: on the input only, or drawn above the box. */
export type SearchFieldLabelLayout = Extract<FieldLabelLayout, 'label-control' | 'control-only'>;
/** A query's check: an error message, or several, for an invalid query; `true` or nothing when valid. */
export type SearchFieldValidate = (value: string) => string | string[] | true | null | undefined;
export interface SearchFieldProps extends BaseProps, FieldTextInputProps, FocusEventProps, KeyboardEventProps {
    /** The accessible name of the search box, and its visible label in the `label-control` layout. */
    label: string;
    /** The query, controlled. */
    value?: string | undefined;
    /** The query the box starts with, uncontrolled. */
    defaultValue?: string | undefined;
    /** Called with the query on each change. */
    onChange?: ((value: string) => void) | undefined;
    /** Called with the query when Enter is pressed. */
    onSubmit?: ((value: string) => void) | undefined;
    /** Called after Escape or the clear button empties the query. */
    onClear?: (() => void) | undefined;
    /** The form name the query submits under. */
    name?: string | undefined;
    isDisabled?: boolean | undefined;
    isReadOnly?: boolean | undefined;
    /** Marks the query invalid, which shows `errorMessage` in the `label-control` layout. */
    isInvalid?: boolean | undefined;
    /** Checks the query; its messages show while the query is invalid. */
    validate?: SearchFieldValidate | undefined;
    /** `native` (the default) also reports `validate`'s error to the browser's constraint validation. */
    validationBehavior?: FieldValidationBehavior | undefined;
    /** Names the clear button. Defaults to the provider's `clearSearch`. */
    clearLabel?: string | undefined;
    /** Visible text for the clear button, which otherwise shows the `close` glyph. */
    clearText?: string | undefined;
    /** Box size. Defaults to `md`. */
    size?: SearchFieldSize | undefined;
    /**
     * `control-only` (the default) names the input with the label; `label-control` draws the label
     * above the box, and the description and error message below it.
     */
    labelLayout?: SearchFieldLabelLayout | undefined;
    /** In the `label-control` layout, help text below the box, which describes the input. */
    description?: ReactNode;
    /**
     * In the `label-control` layout, the message shown below the box while the query is invalid.
     * Defaults to the messages of `validate`.
     */
    errorMessage?: ReactNode;
    /** Results are loading: a spinner shows after the input. */
    isPending?: boolean | undefined;
    /** Receives the input, so a caller can move focus to it. */
    inputRef?: RefObject<HTMLInputElement | null> | undefined;
}
/**
 * A search or filter box: a search glyph, the query input, a spinner while results load and a clear
 * button while it holds text. Escape clears the query and Enter submits it. In the `label-control`
 * layout it also draws its label, description and error message around the box.
 */
export declare function SearchField({ label, placeholder, clearLabel, clearText, size, labelLayout, description, errorMessage, isPending, inputRef, className, onClear, spellCheck, ...rest }: SearchFieldProps): import("react").JSX.Element;
//# sourceMappingURL=search-field.d.ts.map