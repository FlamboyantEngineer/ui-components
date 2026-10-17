import { describe, expect, it } from 'vitest';
import {
  describeFormatInputs,
  formatColor,
  hasAlpha,
  toColor,
  toStoredValue,
} from './color-values.js';

describe('color values', () => {
  it('UIC-COLOR-FIELD-3.1 knows the alpha formats', () => {
    expect(['hexa', 'rgba', 'hsla', 'hsba'].every((format) => hasAlpha(format as 'hexa'))).toBe(
      true,
    );
    expect(['hex', 'rgb', 'hsl', 'hsb'].some((format) => hasAlpha(format as 'hex'))).toBe(false);
    const color = toColor('#33669980');
    expect(color && formatColor(color, 'rgba')).toBe('rgba(51, 102, 153, 0.5)');
    expect(color && formatColor(color, 'hexa')).toBe('#33669980');
    expect(color && formatColor(color, 'hex')).toBe('#336699');
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
    const color = toColor('rgba(51, 102, 153, 0.5)');
    expect(color).not.toBeNull();
    if (!color) return;
    expect(toStoredValue(color, 'hex')).toBe('#336699');
    expect(toStoredValue(color, 'hexa')).toBe('#33669980');
    expect(toStoredValue(color, 'rgb')).toBe('rgb(51, 102, 153)');
    expect(toStoredValue(color, 'rgba')).toBe('rgba(51, 102, 153, 0.5)');
    expect(toStoredValue(color, 'hsl')).toBe('hsl(210, 50%, 40%)');
    expect(toColor('336699')?.toString('hex')).toBe('#336699');
    expect(toColor('hsl(210, 50%, 40%)')?.toString('hex')).toBe('#336699');
    expect(toColor('not a colour')).toBeNull();
    expect(toColor('  ')).toBeNull();
    expect(toColor(null)).toBeNull();
  });
});
