import { describe, expect, it } from 'vitest';
import { formatLocaleDecimal, parseLocaleDecimal } from './decimal-locale.js';

describe('decimal locale text', () => {
  it('UIC-DECIMAL-FIELD-1.3 writes every digit in the locale without rounding', () => {
    expect(formatLocaleDecimal('9007199254740993', 'en-US')).toBe('9,007,199,254,740,993');
    expect(formatLocaleDecimal('-1234.000000000000000000001', 'en-US')).toBe(
      '-1,234.000000000000000000001',
    );
    expect(formatLocaleDecimal('-0.5', 'en-US')).toBe('-0.5');
    expect(formatLocaleDecimal('1234.5', 'de-DE')).toBe('1.234,5');
    expect(formatLocaleDecimal('1234.5', 'fr-FR')).toBe('1 234,5');
    expect(formatLocaleDecimal('1234.5', 'en-US', { useGrouping: false })).toBe('1234.5');
    expect(formatLocaleDecimal('12.5', 'en-US', { minimumFractionDigits: 2 })).toBe('12.50');
    expect(formatLocaleDecimal('12.5', 'ar-EG')).toBe('١٢٫٥');
  });

  it('UIC-DECIMAL-FIELD-1.3 reads separators, digits and minus signs of the locale', () => {
    expect(parseLocaleDecimal('9,007,199,254,740,993', 'en-US')).toEqual({
      value: '9007199254740993',
    });
    expect(parseLocaleDecimal('1.234,50', 'de-DE')).toEqual({ value: '1234.5' });
    expect(parseLocaleDecimal('1 234,5', 'fr-FR')).toEqual({ value: '1234.5' });
    expect(parseLocaleDecimal('1.5', 'fr-FR')).toEqual({ value: '1.5' });
    expect(parseLocaleDecimal('−3.25', 'en-US')).toEqual({ value: '-3.25' });
    expect(parseLocaleDecimal('١٢٫٥', 'ar-EG')).toEqual({ value: '12.5' });
    expect(parseLocaleDecimal('  ', 'en-US')).toEqual({ value: null });
    expect(parseLocaleDecimal('1.', 'en-US')).toEqual({ value: '1' });
    for (const text of ['-', '12abc', '1e5', '1.2.3']) {
      expect(parseLocaleDecimal(text, 'en-US')).toBeNull();
    }
  });
});
