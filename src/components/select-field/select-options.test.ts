import { describe, expect, it } from 'vitest';
import {
  diffSelectKeys,
  mergeSelectOptions,
  orderSelectKeys,
  resolveSelectOptions,
  toSelectKeys,
} from './select-options.js';

const fruit = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'plum', label: 'Plum' },
];

describe('select options', () => {
  it('UIC-SELECT-FIELD-1.2 reads single and multiple values as keys without repeats', () => {
    expect(toSelectKeys(null)).toEqual([]);
    expect(toSelectKeys(undefined)).toEqual([]);
    expect(toSelectKeys('')).toEqual([]);
    expect(toSelectKeys('apple')).toEqual(['apple']);
    expect(toSelectKeys(0)).toEqual([0]);
    expect(toSelectKeys(['pear', 'apple', 'pear'])).toEqual(['pear', 'apple']);
  });

  it('UIC-SELECT-FIELD-1.2 orders keys by the options, unknown keys after in their order', () => {
    expect(orderSelectKeys(['plum', 'zebra', 'apple', 'yak'], fruit)).toEqual([
      'apple',
      'plum',
      'zebra',
      'yak',
    ]);
  });

  it('UIC-SELECT-FIELD-1.2 resolves chosen keys, standing in for unknown ones with the key', () => {
    expect(resolveSelectOptions(['pear', 7], fruit)).toEqual([
      { id: 'pear', label: 'Pear', isMissing: false },
      { id: 7, label: '7', isMissing: true },
    ]);
  });

  it('UIC-SELECT-FIELD-5.1 merges option lists, the first option of each key winning', () => {
    const fetched = [
      { id: 'pear', label: 'Fetched pear' },
      { id: 'fig', label: 'Fig' },
    ];
    expect(mergeSelectOptions(fruit.slice(0, 2), fetched)).toEqual([
      { id: 'apple', label: 'Apple' },
      { id: 'pear', label: 'Pear' },
      { id: 'fig', label: 'Fig' },
    ]);
  });

  it('UIC-SELECT-FIELD-4.3 tells added and removed keys from the committed ones', () => {
    const diff = diffSelectKeys(['pear', 'plum'], ['apple', 'pear']);
    expect([...diff.added]).toEqual(['plum']);
    expect(diff.removed).toEqual(['apple']);
  });
});
