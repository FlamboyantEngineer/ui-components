import type { ReactNode, Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, ControlSize } from '../../core/props.js';
export interface SwitchProps extends BaseProps, AriaLabellingProps {
    /** Whether the switch is on, controlled. */
    isSelected?: boolean | undefined;
    /** Whether the switch starts on, uncontrolled. */
    defaultSelected?: boolean | undefined;
    /** Called with the new state when the switch is flipped. */
    onChange?: ((isSelected: boolean) => void) | undefined;
    /** The form name the switch submits `value` under while on. */
    name?: string | undefined;
    /** The value submitted while on. Defaults to `on`. */
    value?: string | undefined;
    /** Keeps the state and reports no change. */
    isReadOnly?: boolean | undefined;
    isDisabled?: boolean | undefined;
    /** Focuses the switch when it mounts. */
    autoFocus?: boolean | undefined;
    /** Receives the native input. */
    inputRef?: Ref<HTMLInputElement> | undefined;
    /** The row's height on the shared control scale, which sizes the track and label. Defaults to `md`. */
    size?: ControlSize | undefined;
    /** The visible label. It names the switch, and pressing it flips the switch. */
    children?: ReactNode;
}
/**
 * An on-off switch on React Aria's `Switch`, with no field around it: a native input with role
 * `switch` inside a `<label>`, a track and thumb, and an optional visible label.
 */
export declare function Switch({ children, size, className, ...rest }: SwitchProps): import("react").JSX.Element;
//# sourceMappingURL=switch.d.ts.map