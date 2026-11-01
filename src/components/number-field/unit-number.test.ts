import { describe, expect, it } from 'vitest';
import { parseLocaleNumber, parseQuantity, type NumberFieldUnits } from './unit-number.js';

const lengths: NumberFieldUnits = { unit: 'mm', conversions: { cm: 10, m: 1000, in: 25.4 } };

describe('unit numbers', () => {
  it('UIC-NUMBER-FIELD-3.4 reads a typed quantity in the field unit', () => {
    expect(parseQuantity('5cm', lengths, 'en-US')).toBe(50);
    expect(parseQuantity(' 5 cm ', lengths, 'en-US')).toBe(50);
    expect(parseQuantity('0.1 m', lengths, 'en-US')).toBe(100);
    expect(parseQuantity('1.5in', lengths, 'en-US')).toBe(38.1);
    expect(parseQuantity('12', lengths, 'en-US')).toBe(12);
    expect(parseQuantity('12mm', lengths, 'en-US')).toBe(12);
    expect(parseQuantity('-2,5 cm', lengths, 'fr-FR')).toBe(-25);
    expect(parseQuantity('1.250,5 mm', lengths, 'de-DE')).toBe(1250.5);
    expect(parseQuantity('5 CM', lengths, 'en-US')).toBe(50);
    expect(parseQuantity('', lengths, 'en-US')).toBeNull();
    expect(parseQuantity('  ', lengths, 'en-US')).toBeNull();
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
      expect(parseQuantity(text, lengths, 'en-US'), text).toBeNaN();
  });

  it('UIC-NUMBER-FIELD-3.4 reads locale numbers', () => {
    expect(parseLocaleNumber('1,234.5', 'en-US')).toBe(1234.5);
    expect(parseLocaleNumber('1 234,5', 'fr-FR')).toBe(1234.5);
    expect(parseLocaleNumber('−3', 'en-US')).toBe(-3);
    expect(parseLocaleNumber('1.5e3', 'en-US')).toBe(1500);
    expect(parseLocaleNumber('abc', 'en-US')).toBeNaN();
  });
});
