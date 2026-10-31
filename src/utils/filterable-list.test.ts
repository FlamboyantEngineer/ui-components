import { describe, expect, it } from 'vitest';
import { FILTERABLE_LIST_LENGTH, isFilterableLength } from './filterable-list.js';

describe('isFilterableLength', () => {
  it('UIC-SELECT-FIELD-3.5 UIC-FACET-LIST-1.3 UIC-FILTER-BAR-2.3 searches lists longer than ten entries', () => {
    expect(FILTERABLE_LIST_LENGTH).toBe(10);
    expect(isFilterableLength(10)).toBe(false);
    expect(isFilterableLength(11)).toBe(true);
  });
});
