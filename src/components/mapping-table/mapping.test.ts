import { describe, expect, it } from 'vitest';
import {
  readMappedTarget,
  suggestMapping,
  summarizeMapping,
  type MappingTableColumn,
  type MappingTableTarget,
} from './mapping.js';

const columns: MappingTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'mail', label: 'Mail' },
  { id: 'town', label: 'Town' },
  { id: 'notes', label: 'Notes' },
];

const targets: MappingTableTarget[] = [
  { id: 'full-name', label: 'Full name', isRequired: true },
  { id: 'email', label: 'Email', isRequired: true },
  { id: 'city', label: 'City' },
];

describe('mapping data', () => {
  it('UIC-MAPPING-TABLE-1.3 maps each column to its suggestion when it is a known target', () => {
    const suggest = (column: MappingTableColumn) =>
      ({ name: 'full-name', mail: 'email', town: 'county' })[column.id] ?? null;
    expect(suggestMapping(columns, targets, suggest)).toEqual({
      name: 'full-name',
      mail: 'email',
      town: null,
      notes: null,
    });
    expect(suggestMapping(columns, targets, undefined)).toEqual({
      name: null,
      mail: null,
      town: null,
      notes: null,
    });
  });

  it('UIC-MAPPING-TABLE-1.2 reads missing, empty and unknown targets as not imported', () => {
    const value = { name: 'full-name', mail: null, town: 'county' };
    expect(readMappedTarget(value, 'name', targets)).toBe('full-name');
    expect(readMappedTarget(value, 'mail', targets)).toBeNull();
    expect(readMappedTarget(value, 'town', targets)).toBeNull();
    expect(readMappedTarget(value, 'notes', targets)).toBeNull();
  });

  it('UIC-MAPPING-TABLE-2.2 UIC-MAPPING-TABLE-2.3 UIC-MAPPING-TABLE-2.4 counts columns and finds unmapped and duplicate targets', () => {
    expect(summarizeMapping(columns, targets, { name: 'full-name', town: 'country' })).toEqual({
      mappedCount: 1,
      skippedCount: 3,
      unmappedRequired: ['email'],
      duplicates: {},
      isComplete: false,
    });
    expect(
      summarizeMapping(columns, targets, {
        name: 'full-name',
        mail: 'email',
        town: 'city',
        notes: 'email',
      }),
    ).toEqual({
      mappedCount: 4,
      skippedCount: 0,
      unmappedRequired: [],
      duplicates: { email: ['mail', 'notes'] },
      isComplete: true,
    });
  });
});
