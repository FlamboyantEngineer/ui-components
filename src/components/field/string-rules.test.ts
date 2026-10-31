import { describe, expect, it } from 'vitest';
import { getDefaultStrings } from '../../core/strings.js';

const defaultStrings = getDefaultStrings();
import { countCodePoints, validateString } from './string-rules.js';

describe('validateString', () => {
  it('UIC-FIELD-7.4 names the broken rule and counts length with getLength', () => {
    expect(validateString('abcd', { maxLength: 3 }, defaultStrings)?.validity).toBe('tooLong');
    expect(validateString('a1', { pattern: /[a-z]+/ }, defaultStrings)?.validity).toBe(
      'patternMismatch',
    );
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    expect(countCodePoints(family)).toBe(5);
    expect(validateString(family, { maxLength: 1 }, defaultStrings)?.validity).toBe('tooLong');
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const getLength = (text: string) => [...segmenter.segment(text)].length;
    expect(validateString(family, { maxLength: 1, getLength }, defaultStrings)).toBeNull();
    expect(validateString('ab', { minLength: 3, getLength: () => 3 }, defaultStrings)).toBeNull();
  });

  it('UIC-FIELD-7.1 reports texts outside the length range, counting characters', () => {
    expect(validateString('ab', { minLength: 3 }, defaultStrings)).toEqual({
      severity: 'error',
      message: 'Use at least 3 characters.',
      validity: 'tooShort',
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

  it('UIC-FIELD-7.2 matches the whole text whatever the flags', () => {
    const mismatch = (text: string, pattern: RegExp) =>
      validateString(text, { pattern }, defaultStrings)?.validity;
    expect(mismatch('bad\nok\nbad', /ok/m)).toBe('patternMismatch');
    expect(mismatch('\nok', /ok/m)).toBe('patternMismatch');
    expect(mismatch('ok\n', /ok/m)).toBe('patternMismatch');
    expect(mismatch('ok\nok', /^ok$\n^ok$/m)).toBeUndefined();
    expect(mismatch('ok\nok', /(?:ok\n?)+/m)).toBeUndefined();
    expect(mismatch('ab', /a|ab/)).toBeUndefined();
    expect(mismatch('😀😀', /\p{Emoji}+/u)).toBeUndefined();
    expect(mismatch('ab', new RegExp('[\\q{ab}]', 'v'))).toBeUndefined();
    const sticky = /ok/y;
    sticky.lastIndex = 2;
    const global = /ok/g;
    global.lastIndex = 5;
    for (let check = 0; check < 3; check += 1) {
      expect(mismatch('ok', sticky)).toBeUndefined();
      expect(mismatch('ok', global)).toBeUndefined();
      expect(mismatch('no', global)).toBe('patternMismatch');
    }
    expect(sticky.lastIndex).toBe(2);
    expect(global.lastIndex).toBe(5);
    expect(validateString('  ok  ', { pattern: /ok/m, trim: true }, defaultStrings)).toBeNull();
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
