// A colour field's value model: the stored text, the formats it is written and edited in, and the
// channels each format's inputs edit.

import { parseColor } from '../../primitives/index.js';

/** How a colour is written and edited: hex, RGB, HSL or HSB; alpha follows transparency. */
export type ColorFieldFormat = 'hex' | 'rgb' | 'hsl' | 'hsb';

/** A format as React Aria writes it, with alpha (`hexa`, `rgba`) or without. */
type ColorNotation = ColorFieldFormat | 'hexa' | 'rgba' | 'hsla' | 'hsba';

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

/** A colour that writes itself in a format and reads its alpha, such as the one the picker reports. */
interface FormattableColor {
  toString(format: ColorNotation): string;
  getChannelValue(channel: 'alpha'): number;
}

const spaces: Record<ColorFieldFormat, ColorFormatSpace | undefined> = {
  hex: undefined,
  rgb: 'rgb',
  hsl: 'hsl',
  hsb: 'hsb',
};

/**
 * The notation a colour is written in: the format with alpha while transparency is allowed or the
 * colour is translucent, so an alpha the field cannot edit is kept rather than dropped.
 */
function toNotation(
  color: Pick<FormattableColor, 'getChannelValue'>,
  format: ColorFieldFormat,
  allowsTransparency: boolean,
): ColorNotation {
  return allowsTransparency || color.getChannelValue('alpha') < 1 ? `${format}a` : format;
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
 * A colour text written in a format, with its alpha while transparency is allowed or the colour is
 * translucent: a decimal alpha to two decimals, so a hex alpha (`80`) reads `0.5` rather than
 * `0.5019607843137255`. Hex keeps its exact alpha byte, as its digits are edited as they are. Text
 * that is no colour is kept.
 */
export function formatColor(
  text: string,
  format: ColorFieldFormat,
  allowsTransparency = false,
): string {
  const color = attemptParse(text);
  if (!color) return text;
  const notation = toNotation(color, format, allowsTransparency);
  if (format === 'hex') return color.toString(notation);
  const alpha = color.getChannelValue('alpha');
  return color.withChannelValue('alpha', Math.round(alpha * 100) / 100).toString(notation);
}

/**
 * The stored text of a colour, with alpha as `formatColor` writes it: hex in lower case
 * (`#rrggbb`, `#rrggbbaa`), other formats as written.
 */
export function toStoredValue(
  color: FormattableColor,
  format: ColorFieldFormat,
  allowsTransparency = false,
): string {
  const text = color.toString(toNotation(color, format, allowsTransparency));
  return format === 'hex' ? text.toLowerCase() : text;
}

/** A typed colour text as the stored text, or `null` when it is no colour. */
export function storeColorText(
  value: string,
  format: ColorFieldFormat,
  allowsTransparency = false,
): string | null {
  const text = toColorText(value);
  const color = text === null ? null : attemptParse(text);
  return color ? toStoredValue(color, format, allowsTransparency) : null;
}

/** The inputs that edit a format: the hex input or the space's three channels, then alpha. */
export function describeFormatInputs(
  format: ColorFieldFormat,
  allowsTransparency = false,
): ColorFormatInputs {
  const space = spaces[format];
  const channels = space ? [...parseColor('#000000').toFormat(space).getColorChannels()] : [];
  return {
    hasHex: !space,
    space,
    channels: allowsTransparency ? [...channels, 'alpha'] : channels,
  };
}

/**
 * A picked colour with the alpha of the colour text it replaces, for a picker that does not edit
 * transparency: its hex input, swatches and eye dropper never change the alpha. Without a previous
 * colour the picked one is kept.
 */
export function keepAlpha<T extends { withChannelValue(channel: 'alpha', value: number): T }>(
  picked: T,
  previous: string | null,
): T {
  const color = previous === null ? null : attemptParse(previous);
  return color ? picked.withChannelValue('alpha', color.getChannelValue('alpha')) : picked;
}
