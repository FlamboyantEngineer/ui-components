import { describe, expect, it } from 'vitest';
import { compareDecimalText } from './decimal-text.js';

describe('compareDecimalText', () => {
  it('UIC-CONSTRAINT-EDITOR-1.2 orders decimal text by value with every digit', () => {
    expect(compareDecimalText('9007199254740993', '9007199254740992')).toBe(1);
    expect(compareDecimalText('0.10', '.1')).toBe(0);
    expect(compareDecimalText('1e-400', '0')).toBe(1);
    expect(compareDecimalText('-1e-400', '0')).toBe(-1);
    expect(compareDecimalText('-2', '-10')).toBe(1);
    expect(compareDecimalText('1.5E3', '1499.9999999999999999')).toBe(1);
    expect(compareDecimalText('-0', '0.000')).toBe(0);
    expect(compareDecimalText('12', '1.2e1')).toBe(0);
    expect(compareDecimalText('abc', '1')).toBeNull();
    expect(compareDecimalText('', '1')).toBeNull();
  });
});
