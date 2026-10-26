import { type ColorFieldFormat } from './color-values.js';
export interface ColorFormatChoiceProps {
    format: ColorFieldFormat;
    /** The formats offered; fewer than two draw nothing. */
    formats: readonly ColorFieldFormat[];
    onFormatChange: (format: ColorFieldFormat) => void;
}
/** The format choice of the picker: one segment per offered format. */
export declare function ColorFormatChoice({ format, formats, onFormatChange }: ColorFormatChoiceProps): import("react").JSX.Element | null;
/**
 * The picker's inputs for its format: a hex input, or a number input per channel of the format's
 * colour space (React Aria `ColorField` with `channel`), then alpha for a format that has it. Each
 * channel input is named by React Aria from its channel.
 */
export declare function ColorChannelInputs({ format }: {
    format: ColorFieldFormat;
}): import("react").JSX.Element;
//# sourceMappingURL=color-field-channels.d.ts.map