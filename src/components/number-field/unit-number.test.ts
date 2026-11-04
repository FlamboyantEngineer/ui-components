import { describe, expect, it } from 'vitest';
import { type NumberFieldUnits, parseLocaleNumber, parseQuantity } from './unit-number.js';

const lengths: NumberFieldUnits = { unit: 'mm', conversions: { cm: 10, m: 1000, in: 25.4 } };
const accounting: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  currencySign: 'accounting',
};

describe('unit numbers', () => {
  it.each(['de-DE', 'fr-FR'])(
    'UIC-NUMBER-FIELD-3.4 preserves decimal commas without grouping in %s',
    (locale) => {
      const options = { useGrouping: false };
      expect(parseLocaleNumber('1,5', locale, options)).toBe(1.5);
      expect(parseLocaleNumber('-1,5', locale, options)).toBe(-1.5);
      expect(parseQuantity('1,5 cm', lengths, { locale, options })).toBe(15);
      expect(parseQuantity('-1,5 cm', lengths, { locale, options })).toBe(-15);
    },
  );

  it('UIC-NUMBER-FIELD-3.4 reads fractional input when formatting hides its decimal separator', () => {
    const options = { useGrouping: false, maximumFractionDigits: 0 };
    expect(parseLocaleNumber('1,5', 'de-DE', options)).toBe(1.5);
    expect(parseLocaleNumber('١٫٥', 'de-DE', { ...options, numberingSystem: 'arab' })).toBe(1.5);
    expect(parseLocaleNumber('1,5', 'de-DE', { style: 'percent', maximumFractionDigits: 0 })).toBe(
      0.015,
    );
  });

  it.each(['en-US', 'fr-FR', 'de-DE'])(
    'UIC-NUMBER-FIELD-3.4 preserves accounting format signs in %s',
    (locale) => {
      const formatter = new Intl.NumberFormat(locale, accounting);
      for (const value of [-1234.5, 1234.5]) {
        const parts = formatter.formatToParts(value);
        const text = parts.map((part) => part.value).join('');
        const withoutCurrency = parts
          .filter((part) => part.type !== 'currency')
          .map((part) => part.value)
          .join('');
        expect(parseLocaleNumber(text, locale, accounting), text).toBe(value);
        expect(parseLocaleNumber(withoutCurrency, locale, accounting), withoutCurrency).toBe(value);
      }
    },
  );

  it('UIC-NUMBER-FIELD-3.4 reads accounting magnitudes, explicit minus and exponent signs', () => {
    expect(parseLocaleNumber('(1.5)', 'en-US', accounting)).toBe(-1.5);
    expect(parseLocaleNumber('-$1.50', 'en-US', accounting)).toBe(-1.5);
    expect(parseLocaleNumber('−1.50', 'en-US', accounting)).toBe(-1.5);
    expect(parseLocaleNumber('(1e-3)', 'en-US', accounting)).toBe(-0.001);
    expect(parseLocaleNumber('(1e+3)', 'en-US', accounting)).toBe(-1000);
    expect(parseQuantity('($1.50) cm', lengths, { locale: 'en-US', options: accounting })).toBe(
      -15,
    );
    expect(parseLocaleNumber('(1.5)', 'en-US')).toBeNaN();
    expect(parseLocaleNumber('(1,5)', 'de-DE', accounting)).toBeNaN();
  });

  it.each([
    '($1.00',
    '$1.00)',
    '(($1.00))',
    '($-1.00)',
    '(+$1.00)',
    '(−1.00)',
    '-($1.00)',
    '(1)(2)',
  ])('UIC-NUMBER-FIELD-3.4 refuses malformed or contradictory accounting signs in %s', (text) => {
    expect(parseLocaleNumber(text, 'en-US', accounting)).toBeNaN();
  });

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
