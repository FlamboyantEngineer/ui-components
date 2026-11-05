import { describe, expect, it } from 'vitest';
import { constraintsByKind, validateConstraints } from './constraint-model.js';

describe('constraint model', () => {
  it('UIC-CONSTRAINT-EDITOR-1.1 offers each kind its constraints', () => {
    expect(constraintsByKind.text).toEqual([
      'required',
      'default',
      'minLength',
      'maxLength',
      'pattern',
    ]);
    expect(constraintsByKind.options).toContain('maxCount');
    expect(constraintsByKind.number).not.toContain('pattern');
  });

  it('UIC-CONSTRAINT-EDITOR-1.2 UIC-CONSTRAINT-EDITOR-1.3 compares numbers as exact decimals', () => {
    expect(
      validateConstraints('number', { minimum: '9007199254740993', maximum: '9007199254740992' }),
    ).toEqual([{ constraint: 'maximum', reason: 'boundsReversed' }]);
    expect(validateConstraints('number', { minimum: '0', maximum: '0', default: '0' })).toEqual([]);
    expect(validateConstraints('number', { minimum: '1e-3', default: '0.0005' })).toEqual([
      { constraint: 'default', reason: 'defaultBelowMinimum' },
    ]);
    expect(validateConstraints('number', { maximum: 'ten', default: '1,5' })).toEqual([
      { constraint: 'default', reason: 'notNumber' },
      { constraint: 'maximum', reason: 'notNumber' },
    ]);
  });

  it('UIC-CONSTRAINT-EDITOR-1.2 UIC-CONSTRAINT-EDITOR-1.3 takes a host comparison for other number types', () => {
    const byLength = (left: string, right: string) => left.length - right.length;
    expect(validateConstraints('number', { minimum: '999', maximum: '1000' }, byLength)).toEqual(
      [],
    );
    expect(validateConstraints('number', { minimum: '1000', maximum: '99' }, byLength)).toEqual([
      { constraint: 'maximum', reason: 'boundsReversed' },
    ]);
  });

  it('UIC-CONSTRAINT-EDITOR-1.3 checks dates, text and options without repairing them', () => {
    const dates = { minimum: '2026-05-01', maximum: '2026-04-01', default: '2026-06-01' };
    expect(validateConstraints('date', dates)).toEqual([
      { constraint: 'maximum', reason: 'boundsReversed' },
      { constraint: 'default', reason: 'defaultAboveMaximum' },
    ]);
    expect(dates).toEqual({ minimum: '2026-05-01', maximum: '2026-04-01', default: '2026-06-01' });
    expect(
      validateConstraints('text', { minLength: 4, maxLength: 2, default: 'ab', pattern: '[a-z]+' }),
    ).toEqual([
      { constraint: 'maxLength', reason: 'lengthsReversed' },
      { constraint: 'default', reason: 'defaultTooShort' },
    ]);
    expect(validateConstraints('text', { maxLength: 1, default: '😀' })).toEqual([]);
    expect(validateConstraints('text', { maxLength: 0, default: 'x' })).toEqual([
      { constraint: 'default', reason: 'defaultTooLong' },
    ]);
    expect(validateConstraints('text', { pattern: '[a-z' })).toEqual([
      { constraint: 'pattern', reason: 'patternInvalid' },
    ]);
    expect(validateConstraints('text', { pattern: '\\d+', default: '12a' })).toEqual([
      { constraint: 'default', reason: 'defaultPatternMismatch' },
    ]);
    expect(validateConstraints('options', { minCount: 3, maxCount: 1 })).toEqual([
      { constraint: 'maxCount', reason: 'countsReversed' },
    ]);
  });
});
