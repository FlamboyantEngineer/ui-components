import { describe, expect, it } from 'vitest';
import { parseLocaleNumber, parseQuantity, type NumberFieldUnits } from './unit-number.js';

const lengths: NumberFieldUnits = { unit: 'mm', conversions: { cm: 10, m: 1000, in: 25.4 } };

describe('unit numbers', () => {
  it('UIC-NUMBER-FIELD-3.4 reads a typed quantity in the field unit', () => {
    expect(parseQuantity('5cm', lengths, { locale: 'en-US' })).toBe(50);
    expect(parseQuantity(' 5 cm ', lengths, { locale: 'en-US' })).toBe(50);
    expect(parseQuantity('0.1 m', lengths, { locale: 'en-US' })).toBe(100);
    expect(parseQuantity('1.5in', lengths, { locale: 'en-US' })).toBe(38.1);
    expect(parseQuantity('12', lengths, { locale: 'en-US' })).toBe(12);
    expect(parseQuantity('12mm', lengths, { locale: 'en-US' })).toBe(12);
    expect(parseQuantity('-2,5 cm', lengths, { locale: 'fr-FR' })).toBe(-25);
    expect(parseQuantity('1.250,5 mm', lengths, { locale: 'de-DE' })).toBe(1250.5);
    expect(parseQuantity('5 CM', lengths, { locale: 'en-US' })).toBe(50);
    expect(parseQuantity('', lengths, { locale: 'en-US' })).toBeNull();
    expect(parseQuantity('  ', lengths, { locale: 'en-US' })).toBeNull();
  });

  it('UIC-NUMBER-FIELD-3.4 refuses unknown units and malformed numbers', () => {
    for (const text of [
      '5 km',
      '5 parsec',
      'cm',
      '5..0 cm',
      'five cm',
      '5 cm cm',
      '1e400',
      '5 c m',
    ])
      expect(parseQuantity(text, lengths, { locale: 'en-US' }), text).toBeNaN();
  });

  it('UIC-NUMBER-FIELD-3.4 reads locale numbers', () => {
    expect(parseLocaleNumber('1,234.5', 'en-US')).toBe(1234.5);
    expect(parseLocaleNumber('1 234,5', 'fr-FR')).toBe(1234.5);
    expect(parseLocaleNumber('−3', 'en-US')).toBe(-3);
    expect(parseLocaleNumber('1.5e3', 'en-US')).toBe(1500);
    expect(parseLocaleNumber('abc', 'en-US')).toBeNaN();
  });

  it('UIC-NUMBER-FIELD-3.4 reads back what the locale and format options write', () => {
    const percent = { style: 'percent' } as const;
    const cases: [string, Intl.NumberFormatOptions | undefined, number][] = [
      ['ar-EG', undefined, -12345.6],
      ['ar-EG', undefined, 10],
      ['ar-EG', percent, 0.25],
      ['en-US', percent, 0.25],
      ['fr-FR', percent, -1.5],
      ['de-CH', undefined, 1234567.5],
      ['hi-IN-u-nu-deva', undefined, 42.5],
      ['en-US', { style: 'currency', currency: 'EUR' }, -3.25],
    ];
    for (const [locale, options, value] of cases) {
      const text = new Intl.NumberFormat(locale, options).format(value);
      expect(parseLocaleNumber(text, locale, options), text).toBe(value);
    }
    expect(parseLocaleNumber('١٢', 'ar-EG')).toBe(12);
    expect(parseLocaleNumber('12', 'ar-EG')).toBe(12);
    expect(parseLocaleNumber('25', 'en-US', percent)).toBe(0.25);
    expect(parseQuantity('١٫٥ cm', lengths, { locale: 'ar-EG' })).toBe(15);
    expect(parseQuantity('٢٥٪ cm', lengths, { locale: 'ar-EG', options: percent })).toBe(2.5);
  });
});
