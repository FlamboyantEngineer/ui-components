// A colour field's value model: the stored text, the formats it is written and edited in, and the
// channels each format's inputs edit.

import { parseColor } from '../../primitives/index.js';

/** How a colour is written and edited: hex, RGB, HSL or HSB, each with or without alpha. */
export type ColorFieldFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';

/** The colour space a format's channel inputs edit. */
export type ColorFormatSpace = 'rgb' | 'hsl' | 'hsb';

/** A channel a colour input edits. */
export type ColorFormatChannel =
  | 'red'
  | 'green'
  | 'blue'
  | 'hue'
  | 'saturation'
  | 'lightness'
  | 'brightness'
  | 'alpha';

/** The inputs a format edits with: a hex input or the channels of a colour space, then alpha. */
interface ColorFormatInputs {
  hasHex: boolean;
  space: ColorFormatSpace | undefined;
  channels: ColorFormatChannel[];
}

/** A colour that writes itself in a format, such as the one the picker reports. */
interface FormattableColor {
  toString(format: ColorFieldFormat): string;
}

const alphaFormats = new Set<ColorFieldFormat>(['hexa', 'rgba', 'hsla', 'hsba']);

const spaces: Record<ColorFieldFormat, ColorFormatSpace | undefined> = {
  hex: undefined,
  hexa: undefined,
  rgb: 'rgb',
  rgba: 'rgb',
  hsl: 'hsl',
  hsla: 'hsl',
  hsb: 'hsb',
  hsba: 'hsb',
};

/** A format that carries an alpha channel. */
export function hasAlpha(format: ColorFieldFormat): boolean {
  return alphaFormats.has(format);
}

function attemptParse(text: string) {
  try {
    return parseColor(text);
  } catch {
    return null;
  }
}

/**
 * A colour text as the CSS colour it spells, trimmed and with a `#` added to bare hex digits;
 * `null` when it is no colour.
 */
export function toColorText(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  return [text, `#${text}`].find((candidate) => attemptParse(candidate) !== null) ?? null;
}

/**
 * A colour text written in a format, with a decimal alpha to two decimals, so a hex alpha (`80`)
 * reads `0.5` rather than `0.5019607843137255`. Hex keeps its exact alpha byte, as its digits are
 * edited as they are. Text that is no colour is kept.
 */
export function formatColor(text: string, format: ColorFieldFormat): string {
  const color = attemptParse(text);
  if (!color) return text;
  if (format === 'hex' || format === 'hexa') return color.toString(format);
  const alpha = color.getChannelValue('alpha');
  return color.withChannelValue('alpha', Math.round(alpha * 100) / 100).toString(format);
}

/** The stored text of a colour: hex in lower case (`#rrggbb`, `#rrggbbaa`), other formats as written. */
export function toStoredValue(color: FormattableColor, format: ColorFieldFormat): string {
  const text = color.toString(format);
  return format === 'hex' || format === 'hexa' ? text.toLowerCase() : text;
}

/** A typed colour text as the stored text, or `null` when it is no colour. */
export function storeColorText(value: string, format: ColorFieldFormat): string | null {
  const text = toColorText(value);
  const color = text === null ? null : attemptParse(text);
  return color ? toStoredValue(color, format) : null;
}

/** The inputs that edit a format: the hex input or the space's three channels, then alpha. */
export function describeFormatInputs(format: ColorFieldFormat): ColorFormatInputs {
  const space = spaces[format];
  const channels = space ? [...parseColor('#000000').toFormat(space).getColorChannels()] : [];
  return {
    hasHex: !space,
    space,
    channels: hasAlpha(format) ? [...channels, 'alpha'] : channels,
  };
}
