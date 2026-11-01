import { describe, expect, it } from 'vitest';
import {
  describeFormatInputs,
  formatColor,
  storeColorText,
  toColorText,
  toStoredValue,
} from './color-values.js';

describe('color values', () => {
  it('UIC-COLOR-FIELD-3.1 writes alpha while transparency is allowed or the colour is translucent', () => {
    expect(formatColor('#33669980', 'rgb', true)).toBe('rgba(51, 102, 153, 0.5)');
    expect(formatColor('#33669980', 'hex', true)).toBe('#33669980');
    expect(formatColor('#336699', 'hex', true)).toBe('#336699FF');
    expect(formatColor('#336699', 'hsl', true)).toBe('hsla(210, 50%, 40%, 1)');
    // Without transparency an opaque colour has no alpha, and a translucent one keeps it.
    expect(formatColor('#336699', 'hex')).toBe('#336699');
    expect(formatColor('#33669980', 'hex')).toBe('#33669980');
    expect(formatColor('#33669980', 'rgb')).toBe('rgba(51, 102, 153, 0.5)');
    expect(formatColor('not a colour', 'hex')).toBe('not a colour');
  });

  it('UIC-COLOR-FIELD-3.1 keeps every hex alpha byte exact', () => {
    for (let byte = 0; byte < 256; byte += 1) {
      const text = `#123456${byte.toString(16).padStart(2, '0')}`;
      expect(storeColorText(formatColor(text, 'hex', true), 'hex', true)).toBe(text);
    }
    expect(formatColor('#1234567f', 'rgb', true)).toBe('rgba(18, 52, 86, 0.5)');
  });

  it('UIC-COLOR-FIELD-3.2 lists the inputs of each format', () => {
    expect(describeFormatInputs('hex')).toEqual({ hasHex: true, space: undefined, channels: [] });
    expect(describeFormatInputs('hex', true).channels).toEqual(['alpha']);
    expect(describeFormatInputs('rgb')).toEqual({
      hasHex: false,
      space: 'rgb',
      channels: ['red', 'green', 'blue'],
    });
    expect(describeFormatInputs('hsl', true).channels).toEqual([
      'hue',
      'saturation',
      'lightness',
      'alpha',
    ]);
    expect(describeFormatInputs('hsb').channels).toEqual(['hue', 'saturation', 'brightness']);
  });

  it('UIC-COLOR-FIELD-3.4 stores hex in lower case and other formats as written', () => {
    const typed = 'rgba(51, 102, 153, 0.5)';
    expect(storeColorText(typed, 'hex')).toBe('#33669980');
    expect(storeColorText(typed, 'rgb')).toBe('rgba(51, 102, 153, 0.5)');
    expect(storeColorText('rgb(51, 102, 153)', 'hex', true)).toBe('#336699ff');
    expect(storeColorText('rgb(51, 102, 153)', 'rgb')).toBe('rgb(51, 102, 153)');
    expect(storeColorText('rgb(51, 102, 153)', 'hsl')).toBe('hsl(210, 50%, 40%)');
    expect(storeColorText('336699', 'hex')).toBe('#336699');
    expect(storeColorText('hsl(210, 50%, 40%)', 'hex')).toBe('#336699');
    expect(storeColorText('not a colour', 'hex')).toBeNull();
    expect(toStoredValue({ toString: () => '#AABBCC', getChannelValue: () => 1 }, 'hex')).toBe(
      '#aabbcc',
    );
    expect(toColorText(' 336699 ')).toBe('#336699');
    expect(toColorText('rgb(51, 102, 153)')).toBe('rgb(51, 102, 153)');
    expect(toColorText('not a colour')).toBeNull();
    expect(toColorText('  ')).toBeNull();
    expect(toColorText(null)).toBeNull();
  });
});
