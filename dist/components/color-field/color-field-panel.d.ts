import type { FieldState } from '../field/field.js';
import { type ColorFieldFormat } from './color-values.js';
export interface ColorFieldPanelProps {
    label: string;
    state: FieldState<string | null>;
    format: ColorFieldFormat;
    formats: readonly ColorFieldFormat[];
    onFormatChange: (format: ColorFieldFormat) => void;
    /** Preset colours, offered as swatches. */
    swatches: readonly string[];
    /** Draws the eye dropper where the browser has one. */
    allowsEyeDropper: boolean;
}
export declare const colorFieldHooks: import("../../core/hooks.js").ComponentHooks<"value" | "area" | "dialog" | "input" | "track" | "clear" | "group" | "slider" | "entry" | "trigger" | "popover" | "thumb" | "swatch" | "swatches">;
/**
 * The picker popover: the format choice, a saturation and brightness area, the hue slider (and the
 * alpha slider for an alpha format), the format's inputs, the eye dropper, the preset swatches and
 * Clear, which closes the picker once the colour is gone.
 */
export declare function ColorFieldPanel({ label, state, format, formats, onFormatChange, swatches, allowsEyeDropper, }: ColorFieldPanelProps): import("react").JSX.Element;
//# sourceMappingURL=color-field-panel.d.ts.map