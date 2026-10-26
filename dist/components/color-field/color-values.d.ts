/** How a colour is written and edited: hex, RGB, HSL or HSB, each with or without alpha. */
export type ColorFieldFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';
/** The colour space a format's channel inputs edit. */
export type ColorFormatSpace = 'rgb' | 'hsl' | 'hsb';
/** A channel a colour input edits. */
export type ColorFormatChannel = 'red' | 'green' | 'blue' | 'hue' | 'saturation' | 'lightness' | 'brightness' | 'alpha';
/** The inputs a format edits with: a hex input or the channels of a colour space, then alpha. */
export interface ColorFormatInputs {
    hasHex: boolean;
    space: ColorFormatSpace | undefined;
    channels: ColorFormatChannel[];
}
/** A colour that writes itself in a format, such as the one the picker reports. */
export interface FormattableColor {
    toString(format: ColorFieldFormat): string;
}
/** A format that carries an alpha channel. */
export declare function hasAlpha(format: ColorFieldFormat): boolean;
/**
 * A colour text as the CSS colour it spells, trimmed and with a `#` added to bare hex digits;
 * `null` when it is no colour.
 */
export declare function toColorText(value: string | null | undefined): string | null;
/**
 * A colour text written in a format, with alpha to two decimals, so a hex alpha (`80`) reads `0.5`
 * rather than `0.5019607843137255`. Text that is no colour is kept.
 */
export declare function formatColor(text: string, format: ColorFieldFormat): string;
/** The stored text of a colour: hex in lower case (`#rrggbb`, `#rrggbbaa`), other formats as written. */
export declare function toStoredValue(color: FormattableColor, format: ColorFieldFormat): string;
/** A typed colour text as the stored text, or `null` when it is no colour. */
export declare function storeColorText(value: string, format: ColorFieldFormat): string | null;
/** The inputs that edit a format: the hex input or the space's three channels, then alpha. */
export declare function describeFormatInputs(format: ColorFieldFormat): ColorFormatInputs;
//# sourceMappingURL=color-values.d.ts.map