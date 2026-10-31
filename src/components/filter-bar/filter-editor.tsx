'use client';

import { useCallback } from 'react';
import type { FilterOperator } from '../../core/strings/query.js';
import { useUiStrings } from '../../core/provider.js';
import { BooleanField } from '../boolean-field/boolean-field.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { NumberField } from '../number-field/number-field.js';
import {
  PeoplePicker,
  type PeoplePickerLoader,
  type PeoplePickerPerson,
} from '../people-picker/people-picker.js';
import { SelectField } from '../select-field/select-field.js';
import { TextField } from '../text-field/text-field.js';
import {
  changeFilterOperator,
  getFilterOperators,
  getFilterValueKind,
  isDateRange,
  isNumberRange,
  type FilterCondition,
  type FilterField,
  type FilterValue,
} from './filter-model.js';

/** Whether the editor's controls draw their labels or are only named by them. */
export type FilterEditorLabelLayout = 'label-control' | 'control-only';

/** The parts of a condition editor the host component gives its own slot classes. */
type FilterEditorSlot = 'operator' | 'value';

interface FilterConditionFieldsProps {
  field: FilterField;
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  labelLayout: FilterEditorLabelLayout;
  /** The host component's slot class for each part. */
  slotClass: (slot: FilterEditorSlot) => string;
}

interface ValueControlProps extends FilterConditionFieldsProps {
  setValue: (value: FilterValue) => void;
}

function toPeople(options: FilterField['options']): PeoplePickerPerson[] {
  return (options ?? []).map((option) => ({
    id: option.value,
    name: option.label,
    description: option.description,
    src: option.src,
  }));
}

/** Searches a person field's own options by name; it changes only with the options. */
function usePeopleLoader({ options }: FilterField): PeoplePickerLoader {
  return useCallback(
    (query: string) => {
      const needle = query.trim().toLowerCase();
      const people = toPeople(options).filter((person) =>
        person.name.toLowerCase().includes(needle),
      );
      return Promise.resolve(people);
    },
    [options],
  );
}

function PersonValue({ field, condition, labelLayout, slotClass, setValue }: ValueControlProps) {
  const strings = useUiStrings();
  const loadItems = usePeopleLoader(field);
  const value = condition.value as readonly string[];
  const name = labelLayout === 'control-only' ? { 'aria-label': strings.filterValue } : {};
  // The chosen people are known from the field's options, so they show by name before a search.
  const chosen = toPeople(field.options).filter((person) => value.includes(String(person.id)));
  return (
    <PeoplePicker
      {...name}
      className={slotClass('value')}
      label={labelLayout === 'label-control' ? strings.filterValue : undefined}
      selectionMode="multiple"
      loadItems={loadItems}
      knownPeople={chosen}
      value={[...value]}
      onChange={(keys) => setValue(keys.map(String))}
    />
  );
}

function RangeValue({ condition, labelLayout, slotClass, setValue }: ValueControlProps) {
  const strings = useUiStrings();
  const range = isNumberRange(condition.value) ? condition.value : { min: null, max: null };
  return (
    <div className={slotClass('value')} role="group" aria-label={strings.filterValue}>
      <NumberField
        label={strings.rangeFrom}
        labelLayout={labelLayout}
        value={range.min}
        tracksChanges={false}
        onChange={(min) => setValue({ ...range, min })}
      />
      <NumberField
        label={strings.rangeTo}
        labelLayout={labelLayout}
        value={range.max}
        tracksChanges={false}
        onChange={(max) => setValue({ ...range, max })}
      />
    </div>
  );
}

/** The control for the condition's value, chosen by the shape its operator takes. */
function ValueControl(props: ValueControlProps) {
  const strings = useUiStrings();
  const { field, condition, labelLayout, slotClass, setValue } = props;
  const shared = { label: strings.filterValue, labelLayout, className: slotClass('value') };
  const value = condition.value;
  switch (getFilterValueKind(field.type, condition.operator)) {
    case 'none':
      return null;
    case 'number':
      return (
        <NumberField
          {...shared}
          value={value as number | null}
          tracksChanges={false}
          onChange={setValue}
        />
      );
    case 'number-range':
      return <RangeValue {...props} />;
    case 'date':
      return (
        <DateTimeField
          {...shared}
          value={value as string | null}
          tracksChanges={false}
          onChange={setValue}
        />
      );
    case 'date-range': {
      const range = isDateRange(value) ? value : null;
      return (
        <DateTimeField
          {...shared}
          mode="date-range"
          value={range}
          tracksChanges={false}
          onChange={setValue}
        />
      );
    }
    case 'list':
      return field.type === 'person' ? <PersonValue {...props} /> : <ChoiceValue {...props} />;
    case 'boolean':
      return (
        <BooleanField
          {...shared}
          variant="segmented"
          value={value as boolean}
          tracksChanges={false}
          onChange={(next) => setValue(next ?? true)}
        />
      );
    case 'text':
      return (
        <TextField {...shared} value={value as string} tracksChanges={false} onChange={setValue} />
      );
  }
}

function ChoiceValue({ field, condition, labelLayout, slotClass, setValue }: ValueControlProps) {
  const strings = useUiStrings();
  const options = (field.options ?? []).map((option) => ({
    id: option.value,
    label: option.label,
    description: option.description,
  }));
  const value = [...(condition.value as readonly string[])];
  return (
    <SelectField
      label={strings.filterValue}
      labelLayout={labelLayout}
      className={slotClass('value')}
      selectionMode="multiple"
      options={options}
      value={value}
      tracksChanges={false}
      onChange={(keys) => setValue(keys.map(String))}
    />
  );
}

/**
 * The operator and value of one condition: a select of the field's operators (left out when the
 * field offers one), then the value control its operator takes. Each change reports a new condition.
 */
export function FilterConditionFields(props: FilterConditionFieldsProps) {
  const strings = useUiStrings();
  const { field, condition, onChange, labelLayout, slotClass } = props;
  const operators = getFilterOperators(field);
  const setValue = (value: FilterValue) => onChange({ ...condition, value });
  return (
    <>
      {operators.length > 1 ? (
        <SelectField
          label={strings.filterCondition}
          labelLayout={labelLayout}
          className={slotClass('operator')}
          options={operators.map((operator) => ({
            id: operator,
            label: strings.filterOperator(operator),
          }))}
          value={condition.operator}
          tracksChanges={false}
          onChange={(operator) =>
            operator === null
              ? undefined
              : onChange(changeFilterOperator(condition, field, operator as FilterOperator))
          }
        />
      ) : null}
      <ValueControl {...props} setValue={setValue} />
    </>
  );
}
