import type { FieldControlProps } from './field-parts.js';
import { type FieldIssue, type FieldState, type FieldStateOptions } from './field-state.js';
import type { FieldProps } from './field.js';
/**
 * The props a control hands to `Field`: its layout, parts and caller attributes. Whether the field
 * commits on blur is the control's choice, not its caller's.
 */
export type FieldLayoutProps = Omit<FieldProps<unknown>, 'state' | 'children' | 'commitOnBlur'>;
/**
 * The props every field control shares: the field's label, layout and parts, and its value,
 * committed value, validation and locks. A control's props extend it with the control's own options.
 */
export interface FieldInputProps<T> extends FieldStateOptions<T>, FieldLayoutProps {
}
/** The virtual keyboard a text control asks for. */
export type FieldInputMode = 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
/**
 * The native text-entry attributes a text control hands its input: the hint, autofill, the virtual
 * keyboard, spelling and first focus. Length and format rules are `StringRules`.
 */
export interface FieldTextInputProps {
    /** A hint shown while the control is empty. */
    placeholder?: string | undefined;
    /** The browser's autofill hint, such as `email`, `new-password` or `off`. */
    autoComplete?: string | undefined;
    /** The virtual keyboard to show. */
    inputMode?: FieldInputMode | undefined;
    /** Whether the browser checks spelling. Defaults to the browser's choice. */
    spellCheck?: boolean | undefined;
    /** Focuses the control when it mounts. */
    autoFocus?: boolean | undefined;
}
export interface FieldControlOptions<T> {
    /** The value a field starts at, and its default, when the caller gives neither. */
    initialValue: T;
    /** The Clear target when the caller gives none. */
    emptyValue?: T | undefined;
    /** The control's own check, which runs before the caller's `validate`. */
    check?: ((value: T) => FieldIssue | null) | undefined;
}
export interface FieldControl<T, Rest> {
    state: FieldState<T>;
    /** Spread on `Field`: the layout, parts and caller attributes. */
    field: FieldLayoutProps;
    /** The control's own props. */
    rest: Rest;
}
/** The control's own props: everything the field does not take, and the form name, which both use. */
type FieldControlRest<T, P> = Omit<P, Exclude<keyof FieldInputProps<T>, 'name'>>;
/**
 * Builds a field control from its props: the field state (with the control's own check before the
 * caller's `validate`), the props for `Field`, and the props left for the control itself.
 */
export declare function useFieldControl<T, P extends FieldInputProps<T>>(props: P & FieldInputProps<T>, options: FieldControlOptions<T>): FieldControl<T, FieldControlRest<T, P>>;
/**
 * The control props in the library's prop vocabulary, for a control built on a building block: its
 * id, name, description and states. Controls validate through the field, so the building block only
 * reports the field's status (`validationBehavior="aria"`).
 */
export declare function toAriaControlProps(control: FieldControlProps): {
    id: string;
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
    'aria-describedby': string | undefined;
    'aria-errormessage': string | undefined;
    isInvalid: boolean;
    isRequired: boolean;
    isReadOnly: boolean;
    isDisabled: boolean;
    validationBehavior: "aria";
};
export {};
//# sourceMappingURL=field-control.d.ts.map