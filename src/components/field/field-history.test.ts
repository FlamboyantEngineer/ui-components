import { describe, expect, it } from 'vitest';
import { isEmptyValue } from '../../utils/is-empty-value.js';
import {
  canStepFieldHistory,
  createFieldHistory,
  recordFieldHistory,
  stepFieldHistory,
} from './field-history.js';
import { isFieldValueEqual } from './field-value.js';

describe('field history', () => {
  it('UIC-FIELD-5.1 records distinct values and drops redo entries on a new value', () => {
    let history = createFieldHistory('a');
    history = recordFieldHistory(history, 'b');
    expect(recordFieldHistory(history, 'b')).toBe(history);
    history = recordFieldHistory(history, 'c');
    history = stepFieldHistory(stepFieldHistory(history, -1), -1);
    expect(history.entries[history.index]).toBe('a');
    expect(canStepFieldHistory(history, -1)).toBe(false);
    expect(stepFieldHistory(history, -1)).toBe(history);
    history = recordFieldHistory(history, 'x');
    expect(history.entries).toEqual(['a', 'x']);
    expect(canStepFieldHistory(history, 1)).toBe(false);
  });

  it('UIC-FIELD-5.1 keeps the last 100 values', () => {
    let history = createFieldHistory(0);
    for (let value = 1; value <= 150; value += 1) history = recordFieldHistory(history, value);
    expect(history.entries).toHaveLength(100);
    expect(history.entries[0]).toBe(51);
    expect(history.index).toBe(99);
  });

  it('UIC-FIELD-2.3 UIC-FIELD-3.1 compares by structure and knows empty values', () => {
    expect(isFieldValueEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(isFieldValueEqual([1, 2], [2, 1])).toBe(false);
    expect(isFieldValueEqual(null, undefined)).toBe(false);
    expect(isFieldValueEqual(Number.NaN, Number.NaN)).toBe(true);
    for (const empty of [null, undefined, '', '  ', []]) expect(isEmptyValue(empty)).toBe(true);
    for (const value of [false, 0, 'a', [0], {}]) expect(isEmptyValue(value)).toBe(false);
  });
});
