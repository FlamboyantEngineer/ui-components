import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize } from '../../core/props.js';
export interface CheckboxProps extends BaseProps, AriaLabellingProps {
    /** Whether the box is ticked, controlled. */
    isSelected?: boolean | undefined;
    /** Whether the box starts ticked, uncontrolled. */
    defaultSelected?: boolean | undefined;
    /** Called with the new ticked state when the box is toggled. */
    onChange?: ((isSelected: boolean) => void) | undefined;
    /** Draws the mixed state, whatever the ticked state. */
    isIndeterminate?: boolean | undefined;
    /** The form name the box submits `value` under while ticked. */
    name?: string | undefined;
    /** The value submitted while ticked. Defaults to `on`. */
    value?: string | undefined;
    isRequired?: boolean | undefined;
    isInvalid?: boolean | undefined;
    /** Keeps the state and reports no change. */
    isReadOnly?: boolean | undefined;
    isDisabled?: boolean | undefined;
    /** `native` (the default) makes a required box a native constraint; `aria` reports through ARIA only. */
    validationBehavior?: 'aria' | 'native' | undefined;
    /** Receives the native input. */
    inputRef?: Ref<HTMLInputElement> | undefined;
    /** `selection` binds the box to the selection of the list row, tree row or card it sits in. */
    slot?: 'selection' | undefined;
    /** The row's height on the shared control scale, which sizes the box and label. Defaults to `md`. */
    size?: ControlSize | undefined;
    /** The visible label. It names the checkbox, and pressing it toggles the box. */
    children?: ReactNode;
}
/**
 * The state after a press of a three-state box: unset (`null`, drawn mixed) becomes ticked, ticked
 * becomes empty and empty becomes unset again.
 */
export declare function cycleCheckState(value: boolean | null): boolean | null;
/** A tick box on a native checkbox input, with an optional visible label. */
export declare function Checkbox({ children, size, className, ...rest }: CheckboxProps): import("react").JSX.Element;
//# sourceMappingURL=checkbox.d.ts.map