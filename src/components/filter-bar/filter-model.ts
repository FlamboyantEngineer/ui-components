// The filter model shared by the filter bar and the condition builder: fields, operators, values.

import type { FilterOperator } from '../../core/strings/query.js';
import type { DateRangeValue } from '../date-time-field/date-time-field.js';

/** The kind of value a field holds, which sets its operators and its value control. */
export type FilterFieldType = 'text' | 'number' | 'date' | 'choice' | 'person' | 'boolean';

/** One value a `choice` or `person` field offers. */
export interface FilterOption {
  /** The stored value. */
  value: string;
  /** The visible text, also the person's name. */
  label: string;
  /** A secondary line, such as a person's role. */
  description?: string | undefined;
  /** A person's picture URL. */
  src?: string | undefined;
}

/** A field records can be filtered by. */
export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  /** The operators offered, in order. Defaults to every operator of the type. */
  operators?: readonly FilterOperator[] | undefined;
  /** The values a `choice` or `person` field offers. */
  options?: readonly FilterOption[] | undefined;
}

/** A `between` range of numbers. */
export interface FilterNumberRange {
  min: number | null;
  max: number | null;
}

/**
 * A condition's value: text, a number, a `YYYY-MM-DD` date, a boolean, a list of option values, a
 * range of numbers or dates, or `null` for an operator that takes none.
 */
export type FilterValue =
  | string
  | number
  | boolean
  | readonly string[]
  | FilterNumberRange
  | DateRangeValue
  | null;

/** One condition on one field, as plain data. */
export interface FilterCondition {
  /** The field's `id`. */
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

/** The shape of value an operator takes on a field type. */
type FilterValueKind =
  | 'none'
  | 'text'
  | 'number'
  | 'number-range'
  | 'date'
  | 'date-range'
  | 'list'
  | 'boolean';

const defaultOperators: Readonly<Record<FilterFieldType, readonly FilterOperator[]>> = {
  text: ['contains', 'not-contains', 'equals', 'not-equals', 'starts-with', 'empty', 'not-empty'],
  number: [
    'equals',
    'not-equals',
    'less-than',
    'at-most',
    'greater-than',
    'at-least',
    'between',
    'empty',
    'not-empty',
  ],
  date: ['equals', 'before', 'after', 'between', 'empty', 'not-empty'],
  choice: ['any-of', 'none-of', 'empty', 'not-empty'],
  person: ['any-of', 'none-of', 'empty', 'not-empty'],
  boolean: ['equals'],
};

/** The operators a field offers, in order. */
export function getFilterOperators(field: FilterField): readonly FilterOperator[] {
  return field.operators ?? defaultOperators[field.type];
}

/** The shape of value `operator` takes on a field of `type`. */
export function getFilterValueKind(
  type: FilterFieldType,
  operator: FilterOperator,
): FilterValueKind {
  if (operator === 'empty' || operator === 'not-empty') return 'none';
  if (type === 'choice' || type === 'person') return 'list';
  if (type === 'boolean') return 'boolean';
  if (type === 'number') return operator === 'between' ? 'number-range' : 'number';
  if (type === 'date') return operator === 'between' ? 'date-range' : 'date';
  return 'text';
}

const emptyValues: Readonly<Record<FilterValueKind, FilterValue>> = {
  none: null,
  text: '',
  number: null,
  'number-range': { min: null, max: null },
  date: null,
  'date-range': null,
  list: [],
  boolean: true,
};

/** A new condition on `field`: its first operator and that operator's empty value. */
export function createFilterCondition(field: FilterField): FilterCondition {
  const operator = getFilterOperators(field)[0] ?? 'equals';
  return {
    field: field.id,
    operator,
    value: emptyValues[getFilterValueKind(field.type, operator)],
  };
}

/** `condition` with another operator, keeping its value when the new operator takes the same shape. */
export function changeFilterOperator(
  condition: FilterCondition,
  field: FilterField,
  operator: FilterOperator,
): FilterCondition {
  const kind = getFilterValueKind(field.type, operator);
  const isSameKind = kind === getFilterValueKind(field.type, condition.operator);
  return { ...condition, operator, value: isSameKind ? condition.value : emptyValues[kind] };
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Whether a value is a range of numbers. */
export function isNumberRange(value: FilterValue): value is FilterNumberRange {
  return typeof value === 'object' && value !== null && 'min' in value && 'max' in value;
}

/** Whether a value is a range of dates. */
export function isDateRange(value: FilterValue): value is DateRangeValue {
  return typeof value === 'object' && value !== null && 'start' in value && 'end' in value;
}

const completeValueTests: Readonly<Record<FilterValueKind, (value: FilterValue) => boolean>> = {
  none: () => true,
  text: (value) => typeof value === 'string' && value.trim() !== '',
  number: isNumber,
  'number-range': (value) => isNumberRange(value) && isNumber(value.min) && isNumber(value.max),
  date: (value) => typeof value === 'string' && value !== '',
  'date-range': (value) => isDateRange(value) && Boolean(value.start) && Boolean(value.end),
  list: (value) => Array.isArray(value) && value.length > 0,
  boolean: (value) => typeof value === 'boolean',
};

/** Whether a condition has every value its operator needs, so that it filters. */
export function isFilterConditionComplete(condition: FilterCondition, field: FilterField): boolean {
  return completeValueTests[getFilterValueKind(field.type, condition.operator)](condition.value);
}
