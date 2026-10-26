import { type ReactNode } from 'react';
import type { BaseProps, NativeProps } from '../../core/props.js';
export interface FieldsetProps extends Omit<NativeProps<'fieldset'>, 'disabled'>, BaseProps {
    /** The group's caption, drawn in a `<legend>`, which names the group. */
    legend?: ReactNode;
    /** Disables every field and native control inside, as an enclosing disabled fieldset does. */
    isDisabled?: boolean | undefined;
    children?: ReactNode;
}
/**
 * Groups fields under a legend on a native `<fieldset>`. Disabling it disables every field inside:
 * their state refuses changes as well as their native controls.
 */
export declare function Fieldset({ legend, isDisabled, className, children, ...rest }: FieldsetProps): import("react").JSX.Element;
//# sourceMappingURL=fieldset.d.ts.map