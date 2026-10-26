import type { BaseProps } from '../../core/props.js';
import { type DisplayOptionsDensity, type DisplayOptionsProperty, type DisplayOptionsValue } from './display-options-model.js';
export type { DisplayOptionsDensity, DisplayOptionsProperty, DisplayOptionsValue, } from './display-options-model.js';
export interface DisplayOptionsProps extends BaseProps {
    /** The properties the collection has, in their declared order. */
    properties: readonly DisplayOptionsProperty[];
    /** How the collection shows its rows, controlled. */
    value?: DisplayOptionsValue | undefined;
    /** How it shows them at first, uncontrolled. Defaults to every property, ungrouped, unsorted. */
    defaultValue?: DisplayOptionsValue | undefined;
    /** Called with the new value after each change. */
    onChange?: ((value: DisplayOptionsValue) => void) | undefined;
    /** The row spacings offered, in order; without them the popover offers no density. */
    densities?: readonly DisplayOptionsDensity[] | undefined;
    /** The button's text. Defaults to the provider's `display` string. */
    label?: string | undefined;
    /** Disables the button. */
    isDisabled?: boolean | undefined;
}
/**
 * A button that opens a popover of how a collection shows its rows: the property they are grouped
 * by, the property and direction they are sorted by, the properties shown and their order, and the
 * row spacing. The value is plain data the caller applies to a table, a board or a timeline.
 */
export declare function DisplayOptions({ properties, value: valueProp, defaultValue, onChange: onChangeProp, densities, label, isDisabled, className, id, ...rest }: DisplayOptionsProps): import("react").JSX.Element;
//# sourceMappingURL=display-options.d.ts.map