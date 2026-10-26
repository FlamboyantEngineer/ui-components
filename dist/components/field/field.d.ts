import { type ReactNode } from 'react';
import type { BaseProps, ControlSize, Key } from '../../core/props.js';
import { type FieldMenuEntry } from './field-menu.js';
import { type FieldControlProps, type FieldLabelLayout } from './field-parts.js';
import type { FieldIssue, FieldState, FieldValidation } from './field-state.js';
export interface FieldProps<T> extends BaseProps {
    /** The field's controller, from `useFieldState`. */
    state: FieldState<T>;
    /** The field's name: the label text, and the accessible name of its control. */
    label: string;
    /** Where the label sits against the control. Defaults to `label-control`. */
    labelLayout?: FieldLabelLayout | undefined;
    /**
     * The control's height on the shared control scale, which sizes the field's type and its
     * buttons with it. Defaults to `md`.
     */
    size?: ControlSize | undefined;
    /** Help text below the control, which describes it. */
    description?: ReactNode;
    /** Help shown in a tooltip from a help button after the control. */
    help?: ReactNode;
    /** Badges and other marks the host renders for the field; they describe the control. */
    decoration?: ReactNode;
    /** The field menu, opened from a menu button and as the field's context menu. */
    menu?: readonly FieldMenuEntry[] | undefined;
    /** Called with the id of the chosen menu entry, after a built-in action has run. */
    onMenuAction?: ((key: Key) => void) | undefined;
    /**
     * Renders the message the field shows, from its validation and every issue behind it (each with
     * its `validity`), to word a message per validity state or list every issue. Defaults to the
     * validation's message.
     */
    renderMessage?: ((validation: FieldValidation, issues: readonly FieldIssue[]) => ReactNode) | undefined;
    /**
     * Commits the value once focus leaves the field (its control, its buttons and the popovers they
     * open), for a control that commits on blur: moving to the field's own buttons does not commit.
     */
    commitOnBlur?: boolean | undefined;
    /** Renders the control with the props that name, describe and lock it. */
    children: (control: FieldControlProps) => ReactNode;
}
/**
 * Lays out a field around its control: the label, the control, the restore, help and menu buttons,
 * the host's decoration, the description and the validation message. It gives the control its ids
 * and ARIA, applies undo and redo chords pressed inside it, registers its undo for `getFieldUndo`
 * and takes part in an enclosing form.
 */
export declare function Field<T>({ state, label, labelLayout, size, description, help, decoration, menu, onMenuAction, renderMessage, commitOnBlur, children, className, id, ...rest }: FieldProps<T>): import("react").JSX.Element;
export type { FieldControlProps, FieldLabelLayout } from './field-parts.js';
export { toAriaControlProps, useFieldControl } from './field-control.js';
export type { FieldControl, FieldControlOptions, FieldInputMode, FieldInputProps, FieldLayoutProps, FieldTextInputProps, } from './field-control.js';
export type { FieldMenuAction, FieldMenuEntry } from './field-menu.js';
export { FieldPreviousValue } from './field-previous-value.js';
export type { FieldPreviousValueProps } from './field-previous-value.js';
export { FieldRestoreButton } from './field-restore-button.js';
export type { FieldRestoreButtonProps } from './field-restore-button.js';
export { useFieldState } from './field-state.js';
export type { FieldAsyncValidate, FieldIssue, FieldIssues, FieldSeverity, FieldState, FieldStateOptions, FieldStatus, FieldValidation, FieldValidationBehavior, FieldValidationErrors, FieldValidationMode, FieldValidity, } from './field-state.js';
export { FieldScopeContext, useFieldScope } from './field-scope.js';
export type { FieldRegistration, FieldScope } from './field-scope.js';
export { Fieldset } from './fieldset.js';
export type { FieldsetProps } from './fieldset.js';
export { getFieldUndo } from './field-undo.js';
export type { FieldUndo } from './field-undo.js';
export { countCodePoints, validateString } from './string-rules.js';
export type { StringRuleMessages, StringRules } from './string-rules.js';
//# sourceMappingURL=field.d.ts.map