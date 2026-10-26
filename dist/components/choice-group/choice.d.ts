import { type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ElementRender } from '../../utils/render-element.js';
export interface ChoiceRenderState {
    isSelected: boolean;
    isDisabled: boolean;
    isReadOnly: boolean;
    isInvalid: boolean;
    isRequired: boolean;
}
export interface ChoiceProps extends BaseProps, AriaLabellingProps {
    /** Value chosen by this item, submitted under the group's name. */
    value: string;
    isDisabled?: boolean | undefined;
    /** Receives the native input. */
    inputRef?: Ref<HTMLInputElement> | undefined;
    /** Plain or rich visible label. */
    children?: ReactNode;
    /** Description below the label. */
    description?: ReactNode;
    /** Replaces the root div while preserving behavior and hooks. */
    render?: ElementRender<'div', ChoiceRenderState> | undefined;
}
/** One radio or checkbox according to its ChoiceGroup's selection mode. */
export declare function Choice({ children, description, className, ...rest }: ChoiceProps): import("react").JSX.Element;
//# sourceMappingURL=choice.d.ts.map