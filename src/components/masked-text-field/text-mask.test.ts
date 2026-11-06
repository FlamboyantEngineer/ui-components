import { describe, expect, it } from 'vitest';
import {
  deleteAcrossLiterals,
  isMaskComplete,
  isNumericMask,
  maskPlaceholder,
  maskText,
  parseTextMask,
  unmaskText,
} from './text-mask.js';

const phone = parseTextMask('(999) 999-9999');
const reference = parseTextMask('AAA-9999');

describe('text masks', () => {
  it('UIC-MASKED-TEXT-FIELD-1.2 keeps accepted characters and writes literals before filled slots', () => {
    expect(unmaskText('(555) 123-4567', phone)).toBe('5551234567');
    expect(unmaskText('555.123.4567', phone)).toBe('5551234567');
    expect(unmaskText('5a5b5', phone)).toBe('555');
    expect(maskText('5', phone)).toBe('(5');
    expect(maskText('555', phone)).toBe('(555');
    expect(maskText('5551', phone)).toBe('(555) 1');
    expect(maskText('555123456789', phone)).toBe('(555) 123-4567');
    expect(maskText('', phone)).toBe('');
    expect(unmaskText(maskText('5551234', phone), phone)).toBe('5551234');
  });

  it('UIC-MASKED-TEXT-FIELD-1.1 reads tokens, escaped literals and upper-case letters', () => {
    expect(maskText('ab12', reference)).toBe('AB');
    expect(maskText('abc12', reference)).toBe('ABC-12');
    const escaped = parseTextMask('\\9-99');
    expect(escaped.size).toBe(2);
    expect(maskText('12', escaped)).toBe('9-12');
    expect(maskPlaceholder(phone)).toBe('(___) ___-____');
    expect(isNumericMask(phone)).toBe(true);
    expect(isNumericMask(reference)).toBe(false);
  });

  it('UIC-MASKED-TEXT-FIELD-1.3 tells a complete value from a partial one', () => {
    expect(isMaskComplete('5551234567', phone)).toBe(true);
    expect(isMaskComplete('555123', phone)).toBe(false);
  });

  it('UIC-MASKED-TEXT-FIELD-2.2 deletes the nearest slot character past a literal', () => {
    expect(deleteAcrossLiterals('(555) 1234', 6, { direction: -1, mask: phone })).toEqual({
      raw: '551234',
      caret: 3,
    });
    expect(deleteAcrossLiterals('(555) 1234', 4, { direction: 1, mask: phone })).toEqual({
      raw: '555234',
      caret: 4,
    });
    expect(deleteAcrossLiterals('(555) 1234', 3, { direction: -1, mask: phone })).toBeNull();
    expect(deleteAcrossLiterals('(5', 1, { direction: -1, mask: phone })).toBeNull();
  });
});
