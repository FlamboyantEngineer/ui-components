// A colour field's value model: the stored text, the formats it is written and edited in, and the
// channels each format's inputs edit.

import { parseColor, type Color, type ColorChannel, type ColorSpace } from 'react-aria-components';

/** How a colour is written and edited: hex, RGB, HSL or HSB, each with or without alpha. */
export type ColorFieldFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';

/** The inputs a format edits with: a hex input or the channels of a colour space, then alpha. */
export interface ColorFormatInputs {
  hasHex: boolean;
  space: ColorSpace | undefined;
  channels: ColorChannel[];
}

const alphaFormats = new Set<ColorFieldFormat>(['hexa', 'rgba', 'hsla', 'hsba']);

const spaces: Record<ColorFieldFormat, ColorSpace | undefined> = {
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

/** A colour text as a React Aria colour; hex digits may omit the `#`. `null` when it is not one. */
export function toColor(value: string | null | undefined): Color | null {
  const text = value?.trim();
  if (!text) return null;
  for (const candidate of [text, `#${text}`]) {
    try {
      return parseColor(candidate);
    } catch {
      // Not a colour in this spelling; try the next one.
    }
  }
  return null;
}

/**
 * A colour as text in a format, as React Aria writes it but with alpha to two decimals, so a hex
 * alpha (`80`) reads `0.5` rather than `0.5019607843137255`.
 */
export function formatColor(color: Color, format: ColorFieldFormat): string {
  const alpha = color.getChannelValue('alpha');
  return color.withChannelValue('alpha', Math.round(alpha * 100) / 100).toString(format);
}

/** The stored text of a colour: hex in lower case (`#rrggbb`, `#rrggbbaa`), other formats as written. */
export function toStoredValue(color: Color, format: ColorFieldFormat): string {
  const text = color.toString(format);
  return format === 'hex' || format === 'hexa' ? text.toLowerCase() : text;
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
