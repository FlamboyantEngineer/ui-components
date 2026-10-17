import { describe, expect, it } from 'vitest';
import { defaultStrings } from '../../core/strings.js';
import { validateString } from './string-rules.js';

describe('validateString', () => {
  it('UIC-FIELD-7.1 reports texts outside the length range, counting characters', () => {
    expect(validateString('ab', { minLength: 3 }, defaultStrings)).toEqual({
      severity: 'error',
      message: 'Use at least 3 characters.',
    });
    expect(validateString('abcd', { maxLength: 3 }, defaultStrings)?.message).toBe(
      'Use 3 characters or fewer.',
    );
    expect(validateString('🍎🍐', { maxLength: 2 }, defaultStrings)).toBeNull();
    expect(validateString('abc', { minLength: 3, maxLength: 3 }, defaultStrings)).toBeNull();
    expect(defaultStrings.tooShort(1)).toBe('Use at least 1 character.');
    expect(defaultStrings.tooLong(1)).toBe('Use 1 character or fewer.');
  });

  it('UIC-FIELD-7.2 requires the whole text to match the pattern', () => {
    const rules = { pattern: /[A-Z]+-\d+/ };
    expect(validateString('ABC-123', rules, defaultStrings)).toBeNull();
    expect(validateString('xABC-123', rules, defaultStrings)?.message).toBe(
      'Enter a value in the expected format.',
    );
    expect(validateString('abc-1', { pattern: /[a-z]+-\d/gi }, defaultStrings)).toBeNull();
    expect(validateString('abc-1', { pattern: /[a-z]+-\d/gi }, defaultStrings)).toBeNull();
  });

  it('UIC-FIELD-7.3 trims when asked and lets an empty text pass', () => {
    expect(validateString('  ab ', { minLength: 3, trim: true }, defaultStrings)?.message).toBe(
      'Use at least 3 characters.',
    );
    expect(validateString('  ab ', { minLength: 3 }, defaultStrings)).toBeNull();
    expect(validateString('', { minLength: 3, pattern: /x/ }, defaultStrings)).toBeNull();
    expect(validateString('   ', { minLength: 3, trim: true }, defaultStrings)).toBeNull();
  });
});
