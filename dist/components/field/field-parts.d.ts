import { type ReactNode } from 'react';
import type { ControlSize } from '../../core/props.js';
import type { SlotRef } from '../../utils/slot-registry.js';
import type { FieldState, FieldValidation } from './field-state.js';
export type FieldLabelLayout = 'control-label' | 'label-control' | 'label-colon-control' | 'control-only';
/** The id, name, description and state attributes a field gives its control. */
export interface FieldControlProps {
    id: string;
    /** Publishes the control element to the field, which focuses it after a restore. */
    ref: SlotRef;
    /** The label text, in the `control-only` layout, which draws no label element. */
    'aria-label': string | undefined;
    'aria-labelledby': string | undefined;
    'aria-describedby': string | undefined;
    'aria-errormessage': string | undefined;
    'aria-invalid': true | undefined;
    'aria-required': true | undefined;
    readOnly: boolean;
    disabled: boolean;
}
export declare const fieldHooks: import("../../core/hooks.js").ComponentHooks<"label" | "menu" | "help" | "message" | "control" | "description" | "required" | "colon" | "decoration">;
/** The size of a button inside or beside a control of `size`: one step smaller, never below `xs`. */
export declare function toInnerControlSize(size: ControlSize): ControlSize;
export interface FieldIds {
    control: string;
    label: string;
    description: string;
    decoration: string;
    message: string;
    help: string;
}
/** Ids for the field's parts, derived from the caller's `id` or a generated one. */
export declare function useFieldIds(id: string | undefined): FieldIds;
/**
 * The control's props: it is named by the label element, or by `label` when the layout draws none,
 * and described by the parts the field renders.
 */
export declare function toFieldControlProps(state: FieldState<unknown>, ids: FieldIds, parts: {
    ref: SlotRef;
    label: string | undefined;
    hasDescription: boolean;
    hasDecoration: boolean;
}): FieldControlProps;
export declare function FieldLabel({ ids, label, layout, isRequired, }: {
    ids: FieldIds;
    label: string;
    layout: FieldLabelLayout;
    isRequired: boolean;
}): import("react").JSX.Element;
/** The message region. It stays in the document so assistive technology announces new messages. */
export declare function FieldMessage({ id, validation, children, }: {
    id: string;
    validation: FieldValidation;
    children: ReactNode;
}): import("react").JSX.Element;
/** The help button: its tooltip shows the help, which also describes the button while closed. */
export declare function FieldHelp({ id, label, size, children, }: {
    id: string;
    label: string;
    size: ControlSize;
    children: ReactNode;
}): import("react").JSX.Element;
//# sourceMappingURL=field-parts.d.ts.map