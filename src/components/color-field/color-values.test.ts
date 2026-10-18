import { describe, expect, it } from 'vitest';
import {
  describeFormatInputs,
  formatColor,
  hasAlpha,
  storeColorText,
  toColorText,
  toStoredValue,
} from './color-values.js';

describe('color values', () => {
  it('UIC-COLOR-FIELD-3.1 knows the alpha formats', () => {
    expect(['hexa', 'rgba', 'hsla', 'hsba'].every((format) => hasAlpha(format as 'hexa'))).toBe(
      true,
    );
    expect(['hex', 'rgb', 'hsl', 'hsb'].some((format) => hasAlpha(format as 'hex'))).toBe(false);
    expect(formatColor('#33669980', 'rgba')).toBe('rgba(51, 102, 153, 0.5)');
    expect(formatColor('#33669980', 'hexa')).toBe('#33669980');
    expect(formatColor('#33669980', 'hex')).toBe('#336699');
    expect(formatColor('not a colour', 'hex')).toBe('not a colour');
  });

  it('UIC-COLOR-FIELD-3.2 lists the inputs of each format', () => {
    expect(describeFormatInputs('hex')).toEqual({ hasHex: true, space: undefined, channels: [] });
    expect(describeFormatInputs('hexa').channels).toEqual(['alpha']);
    expect(describeFormatInputs('rgb')).toEqual({
      hasHex: false,
      space: 'rgb',
      channels: ['red', 'green', 'blue'],
    });
    expect(describeFormatInputs('hsla').channels).toEqual([
      'hue',
      'saturation',
      'lightness',
      'alpha',
    ]);
    expect(describeFormatInputs('hsb').channels).toEqual(['hue', 'saturation', 'brightness']);
  });

  it('UIC-COLOR-FIELD-3.4 stores hex in lower case and other formats as written', () => {
    const typed = 'rgba(51, 102, 153, 0.5)';
    expect(storeColorText(typed, 'hex')).toBe('#336699');
    expect(storeColorText(typed, 'hexa')).toBe('#33669980');
    expect(storeColorText(typed, 'rgb')).toBe('rgb(51, 102, 153)');
    expect(storeColorText(typed, 'rgba')).toBe('rgba(51, 102, 153, 0.5)');
    expect(storeColorText(typed, 'hsl')).toBe('hsl(210, 50%, 40%)');
    expect(storeColorText('336699', 'hex')).toBe('#336699');
    expect(storeColorText('hsl(210, 50%, 40%)', 'hex')).toBe('#336699');
    expect(storeColorText('not a colour', 'hex')).toBeNull();
    expect(toStoredValue({ toString: () => '#AABBCC' }, 'hex')).toBe('#aabbcc');
    expect(toColorText(' 336699 ')).toBe('#336699');
    expect(toColorText('rgb(51, 102, 153)')).toBe('rgb(51, 102, 153)');
    expect(toColorText('not a colour')).toBeNull();
    expect(toColorText('  ')).toBeNull();
    expect(toColorText(null)).toBeNull();
  });
});
