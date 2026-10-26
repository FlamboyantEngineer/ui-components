import { type ReactNode } from 'react';
import type { ControlSize, Orientation } from '../../core/props.js';
import { type FieldInputProps } from '../field/field.js';
export type ChoiceGroupSize = ControlSize;
export type ChoiceGroupSelectionMode = 'single' | 'multiple';
export type ChoiceGroupValue<M extends ChoiceGroupSelectionMode = 'single'> = M extends 'multiple' ? string[] : string | null;
export interface ChoiceGroupProps<M extends ChoiceGroupSelectionMode = 'single'> extends FieldInputProps<ChoiceGroupValue<M>> {
    /** Choices with plain or rich labels, in display order. */
    children: ReactNode;
    /** One radio selection, or independent checkboxes. Defaults to `single`. */
    selectionMode?: M | undefined;
    /** Layout of the choices. Defaults to `vertical`. */
    orientation?: Orientation | undefined;
    /** Shared control size. Defaults to `md`. */
    size?: ChoiceGroupSize | undefined;
    /** Parent checkbox that selects or clears enabled choices in multiple mode. */
    selectAllLabel?: string | undefined;
}
export interface ChoiceSettings {
    selectionMode: ChoiceGroupSelectionMode;
    size: ControlSize;
    isReadOnly: boolean;
    isDisabled: boolean;
    isInvalid: boolean;
    isRequired: boolean;
}
export declare const ChoiceContext: import("react").Context<ChoiceSettings>;
/** A field that chooses one value with radios or several with checkboxes. Each pick commits. */
export declare function ChoiceGroup<M extends ChoiceGroupSelectionMode = 'single'>({ children, selectionMode, size, ...props }: ChoiceGroupProps<M>): import("react").JSX.Element;
export { Choice } from './choice.js';
export type { ChoiceProps, ChoiceRenderState } from './choice.js';
//# sourceMappingURL=choice-group.d.ts.map