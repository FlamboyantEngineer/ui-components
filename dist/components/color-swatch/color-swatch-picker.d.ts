import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Size } from '../../core/props.js';
/** How the swatches are laid out: a grid (the arrow keys move in two dimensions) or a stack. */
export type ColorSwatchPickerLayout = 'grid' | 'stack';
export interface ColorSwatchPickerProps extends BaseProps, AriaLabellingProps {
    /** The picked colour, as a hex, `rgb()`, `hsl()` or `hsb()` string (controlled). */
    value?: string | undefined;
    /** The colour picked at first, when uncontrolled. */
    defaultValue?: string | undefined;
    /** Called with the picked item's `color`, as the item gives it. */
    onChange?: ((color: string) => void) | undefined;
    /** Defaults to `grid`. */
    layout?: ColorSwatchPickerLayout | undefined;
    /** The size of every swatch in the list. Defaults to `md`. */
    size?: Size | undefined;
    /** The `ColorSwatchPickerItem` choices. */
    children: ReactNode;
}
export interface ColorSwatchPickerItemProps extends Omit<BaseProps, 'id'> {
    /**
     * The colour, as a hex, `rgb()`, `hsl()` or `hsb()` string; it is also what `onChange` receives.
     * An item whose colour is in another notation is left out.
     */
    color: string;
    /** Names the colour instead of its name in the locale. */
    colorName?: string | undefined;
    /** Keeps the swatch listed but not pickable. */
    isDisabled?: boolean | undefined;
}
/**
 * A list of colour swatches to choose one from (React Aria `ColorSwatchPicker`): a single-selection
 * listbox whose arrow keys move between swatches and whose Enter or Space picks one.
 */
export declare function ColorSwatchPicker({ size, className, children, value, defaultValue, onChange, ...rest }: ColorSwatchPickerProps): import("react").JSX.Element;
/** One choice of a `ColorSwatchPicker`: an option drawing its colour as a `ColorSwatch`. */
export declare function ColorSwatchPickerItem({ color, colorName, className, ...rest }: ColorSwatchPickerItemProps): import("react").JSX.Element | null;
//# sourceMappingURL=color-swatch-picker.d.ts.map