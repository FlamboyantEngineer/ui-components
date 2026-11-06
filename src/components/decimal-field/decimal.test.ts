import { describe, expect, it } from 'vitest';
import {
  addDecimals,
  compareDecimals,
  isOnDecimalStep,
  roundDecimal,
  snapDecimal,
  stepDecimal,
  toCanonicalDecimal,
} from './decimal.js';

describe('exact decimals', () => {
  it('UIC-DECIMAL-FIELD-1.2 writes canonical decimals and refuses other text', () => {
    expect(toCanonicalDecimal('+1.50')).toBe('1.5');
    expect(toCanonicalDecimal('-0')).toBe('0');
    expect(toCanonicalDecimal('-0.000')).toBe('0');
    expect(toCanonicalDecimal('007')).toBe('7');
    expect(toCanonicalDecimal('.5')).toBe('0.5');
    expect(toCanonicalDecimal('-.5')).toBe('-0.5');
    expect(toCanonicalDecimal('7.')).toBe('7');
    expect(toCanonicalDecimal('9007199254740993')).toBe('9007199254740993');
    expect(toCanonicalDecimal('0.10000000000000000000000000000000000001')).toBe(
      '0.10000000000000000000000000000000000001',
    );
    for (const text of ['', '-', '.', '1e5', '1,5', 'abc', '1.2.3', 'Infinity']) {
      expect(toCanonicalDecimal(text)).toBeNull();
    }
  });

  it('UIC-DECIMAL-FIELD-2.1 adds and compares exactly', () => {
    expect(addDecimals('0.1', '0.2')).toBe('0.3');
    expect(addDecimals('9007199254740993', '1')).toBe('9007199254740994');
    expect(addDecimals('-0.5', '0.5')).toBe('0');
    expect(compareDecimals('9007199254740993', '9007199254740992')).toBe(1);
    expect(compareDecimals('-1.10', '-1.1')).toBe(0);
    expect(compareDecimals('-2', '1')).toBe(-1);
  });

  it('UIC-DECIMAL-FIELD-2.2 rounds by halfExpand, halfEven and trunc', () => {
    expect(roundDecimal('2.345', 2, 'halfExpand')).toBe('2.35');
    expect(roundDecimal('-2.345', 2, 'halfExpand')).toBe('-2.35');
    expect(roundDecimal('2.345', 2, 'halfEven')).toBe('2.34');
    expect(roundDecimal('2.355', 2, 'halfEven')).toBe('2.36');
    expect(roundDecimal('2.349', 2, 'trunc')).toBe('2.34');
    expect(roundDecimal('-2.349', 2, 'trunc')).toBe('-2.34');
    expect(roundDecimal('2.3', 2, 'halfExpand')).toBe('2.3');
    expect(roundDecimal('0.004', 2, 'halfExpand')).toBe('0');
  });

  it('UIC-DECIMAL-FIELD-2.1 UIC-DECIMAL-FIELD-2.5 checks, snaps and steps on the grid within bounds', () => {
    const grid = { step: '0.1', origin: '0' };
    expect(isOnDecimalStep('0.3', grid)).toBe(true);
    expect(isOnDecimalStep('0.35', grid)).toBe(false);
    expect(snapDecimal('0.35', grid)).toBe('0.4');
    expect(snapDecimal('-0.35', grid)).toBe('-0.4');
    expect(stepDecimal('0.2', 1, grid)).toBe('0.3');
    expect(stepDecimal('0.25', 1, grid)).toBe('0.3');
    expect(stepDecimal('0.25', -1, grid)).toBe('0.2');
    const bounded = { minValue: '0.05', maxValue: '1' };
    const fromMin = { step: '0.1', origin: '0.05' };
    expect(snapDecimal('5', { ...fromMin, ...bounded })).toBe('0.95');
    expect(snapDecimal('-5', { ...fromMin, ...bounded })).toBe('0.05');
    expect(stepDecimal('0.95', 1, { ...fromMin, ...bounded })).toBe('0.95');
    expect(stepDecimal('0.05', -1, { ...fromMin, ...bounded })).toBe('0.05');
    expect(stepDecimal('9007199254740993', 1, { step: '1', origin: '0' })).toBe('9007199254740994');
  });
});
