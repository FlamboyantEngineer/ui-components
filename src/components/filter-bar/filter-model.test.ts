import { describe, expect, it } from 'vitest';
import { getDefaultStrings } from '../../core/strings.js';

const defaultStrings = getDefaultStrings();
import {
  changeFilterOperator,
  createFilterCondition,
  getFilterOperators,
  getFilterValueKind,
  isFilterConditionComplete,
  type FilterField,
} from './filter-model.js';

const text: FilterField = { id: 'title', label: 'Title', type: 'text' };
const number: FilterField = { id: 'pages', label: 'Pages', type: 'number' };
const date: FilterField = { id: 'published', label: 'Published', type: 'date' };
const choice: FilterField = { id: 'genre', label: 'Genre', type: 'choice' };
const person: FilterField = { id: 'reader', label: 'Reader', type: 'person' };
const boolean: FilterField = { id: 'available', label: 'Available', type: 'boolean' };

describe('filter model', () => {
  it('UIC-FILTER-BAR-1.1 offers the operators of each type, or the field’s own', () => {
    const read = (field: FilterField) =>
      getFilterOperators(field).map((operator) => defaultStrings.filterOperator(operator));
    expect(read(text)).toEqual([
      'contains',
      'does not contain',
      'is',
      'is not',
      'starts with',
      'is empty',
      'is not empty',
    ]);
    expect(read(number)).toEqual([
      'is',
      'is not',
      'is less than',
      'is at most',
      'is greater than',
      'is at least',
      'is between',
      'is empty',
      'is not empty',
    ]);
    expect(read(date)).toEqual([
      'is',
      'is before',
      'is after',
      'is between',
      'is empty',
      'is not empty',
    ]);
    expect(read(choice)).toEqual(['is any of', 'is none of', 'is empty', 'is not empty']);
    expect(read(person)).toEqual(read(choice));
    expect(read(boolean)).toEqual(['is']);
    expect(getFilterOperators({ ...number, operators: ['between'] })).toEqual(['between']);
  });

  it('UIC-FILTER-BAR-1.2 gives each operator its value shape', () => {
    expect(getFilterValueKind('text', 'contains')).toBe('text');
    expect(getFilterValueKind('text', 'empty')).toBe('none');
    expect(getFilterValueKind('number', 'at-least')).toBe('number');
    expect(getFilterValueKind('number', 'between')).toBe('number-range');
    expect(getFilterValueKind('date', 'before')).toBe('date');
    expect(getFilterValueKind('date', 'between')).toBe('date-range');
    expect(getFilterValueKind('choice', 'none-of')).toBe('list');
    expect(getFilterValueKind('person', 'any-of')).toBe('list');
    expect(getFilterValueKind('boolean', 'equals')).toBe('boolean');
  });

  it('UIC-FILTER-BAR-1.2 starts a condition at the first operator and an empty value', () => {
    expect(createFilterCondition(text)).toEqual({
      field: 'title',
      operator: 'contains',
      value: '',
    });
    expect(createFilterCondition(number)).toEqual({
      field: 'pages',
      operator: 'equals',
      value: null,
    });
    expect(createFilterCondition(choice)).toEqual({
      field: 'genre',
      operator: 'any-of',
      value: [],
    });
    expect(createFilterCondition(boolean)).toEqual({
      field: 'available',
      operator: 'equals',
      value: true,
    });
    expect(createFilterCondition({ ...number, operators: ['between'] }).value).toEqual({
      min: null,
      max: null,
    });
  });

  it('UIC-FILTER-BAR-1.2 gives every new condition and operator change its own empty range and list', () => {
    const ranged = { ...number, operators: ['between' as const] };
    const first = createFilterCondition(ranged);
    const second = createFilterCondition(ranged);
    expect(first.value).not.toBe(second.value);
    if (first.value && typeof first.value === 'object' && 'min' in first.value) first.value.min = 9;
    expect(second.value).toEqual({ min: null, max: null });
    expect(createFilterCondition(ranged).value).toEqual({ min: null, max: null });
    const condition = { field: 'pages', operator: 'less-than', value: 3 } as const;
    expect(changeFilterOperator(condition, number, 'between').value).not.toBe(
      changeFilterOperator(condition, number, 'between').value,
    );
    expect(createFilterCondition(choice).value).not.toBe(createFilterCondition(choice).value);
  });

  it('UIC-FILTER-BAR-1.2 keeps the value across operators of the same shape', () => {
    const condition = { field: 'pages', operator: 'less-than', value: 3 } as const;
    expect(changeFilterOperator(condition, number, 'at-least')).toEqual({
      field: 'pages',
      operator: 'at-least',
      value: 3,
    });
    expect(changeFilterOperator(condition, number, 'between').value).toEqual({
      min: null,
      max: null,
    });
    expect(changeFilterOperator(condition, number, 'empty').value).toBeNull();
  });

  it('UIC-FILTER-BAR-1.2 knows when a condition holds every value it needs', () => {
    const complete = (field: FilterField, operator: string, value: unknown) =>
      isFilterConditionComplete({ field: field.id, operator, value } as never, field);
    expect(complete(text, 'contains', '  ')).toBe(false);
    expect(complete(text, 'contains', 'sea')).toBe(true);
    expect(complete(text, 'empty', null)).toBe(true);
    expect(complete(number, 'equals', null)).toBe(false);
    expect(complete(number, 'equals', Number.NaN)).toBe(false);
    expect(complete(number, 'equals', 0)).toBe(true);
    expect(complete(number, 'between', { min: 1, max: null })).toBe(false);
    expect(complete(number, 'between', { min: 1, max: 4 })).toBe(true);
    expect(complete(date, 'after', '')).toBe(false);
    expect(complete(date, 'after', '2024-01-02')).toBe(true);
    expect(complete(date, 'between', null)).toBe(false);
    expect(complete(date, 'between', { start: '2024-01-02', end: '2024-02-02' })).toBe(true);
    expect(complete(choice, 'any-of', [])).toBe(false);
    expect(complete(choice, 'any-of', ['history'])).toBe(true);
    expect(complete(boolean, 'equals', null)).toBe(false);
    expect(complete(boolean, 'equals', false)).toBe(true);
  });
});
