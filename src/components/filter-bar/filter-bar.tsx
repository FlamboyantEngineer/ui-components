'use client';

import { PlusGlyph } from '../../core/glyphs.js';
import { useRef, useState, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys, toOccurrenceKey } from '../../utils/stable-keys.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { filterBarHooks as hooks } from './filter-bar-hooks.js';
import { FilterChip } from './filter-chip.js';
import { createFilterCondition, type FilterCondition, type FilterField } from './filter-model.js';

export interface FilterBarProps extends BaseProps, AriaLabellingProps {
  /** The fields records can be filtered by, in the order the add menu lists them. */
  fields: readonly FilterField[];
  /** The active filters, controlled. */
  value?: readonly FilterCondition[] | undefined;
  /** The filters to start with, uncontrolled. */
  defaultValue?: readonly FilterCondition[] | undefined;
  /** Called with the new filters after each change. */
  onChange?: ((value: FilterCondition[]) => void) | undefined;
  /** A free-text search, such as a `SearchField`, drawn first in the bar. */
  search?: ReactNode;
}

const emptyValue: readonly FilterCondition[] = [];

/** The add menu lists its fields behind a search field from this many on. */
const FILTERABLE_FIELD_COUNT = 8;

/**
 * A row of active filters as chips, each reading `Field operator value` and opening its editor in a
 * popover: the operators and the value control follow the field's type. An add menu lists the
 * fields; choosing one adds a filter and opens its editor. Each chip has a remove button, and a
 * clear button removes every filter. A free-text search can lead the row.
 */
export function FilterBar({
  fields,
  value: controlledValue,
  defaultValue = emptyValue,
  onChange,
  search,
  className,
  'aria-label': ariaLabel,
  ...rest
}: FilterBarProps) {
  const strings = useUiStrings();
  const [value, setValue] = useControllableState<readonly FilterCondition[]>(
    controlledValue,
    defaultValue,
    (next) => onChange?.([...next]),
  );
  const [openKey, setOpenKey] = useState<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const keyed = assignOccurrenceKeys(value, (condition) => condition.field);
  const add = (id: Key) => {
    const field = fields.find((candidate) => candidate.id === id);
    if (!field) return;
    const occurrence = value.filter((condition) => condition.field === field.id).length;
    setValue([...value, createFilterCondition(field)]);
    setOpenKey(toOccurrenceKey(field.id, occurrence));
  };
  const remove = (index: number) => {
    setValue(value.filter((_, at) => at !== index));
    addRef.current?.focus();
  };
  const clear = () => {
    setValue([]);
    addRef.current?.focus();
  };
  const chips = keyed.flatMap(({ key, value: condition }, index) => {
    const field = fields.find((candidate) => candidate.id === condition.field);
    return field ? [{ key, condition, field, index }] : [];
  });

  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { empty: value.length === 0 } })}
      role="group"
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.filters)}
    >
      {search ? <div {...hooks.slot('search')}>{search}</div> : null}
      {chips.length > 0 ? (
        <ul {...hooks.slot('list')}>
          {chips.map(({ key, condition, field, index }) => (
            <FilterChip
              key={key}
              field={field}
              condition={condition}
              isOpen={openKey === key}
              onOpenChange={(isOpen) => setOpenKey(isOpen ? key : null)}
              onChange={(next) => setValue(value.map((entry, at) => (at === index ? next : entry)))}
              onRemove={() => remove(index)}
            />
          ))}
        </ul>
      ) : null}
      <DropdownMenu
        ref={addRef}
        label={strings.addFilter}
        icon={PlusGlyph}
        variant="ghost"
        size="sm"
        className={hooks.slotClass('add')}
        filterable={fields.length >= FILTERABLE_FIELD_COUNT}
        items={fields.map((field) => ({ id: field.id, label: field.label }))}
        onAction={add}
      />
      {value.length > 0 ? (
        <Button variant="ghost" size="sm" className={hooks.slotClass('clear')} onPress={clear}>
          {strings.clearAllFilters}
        </Button>
      ) : null}
    </div>
  );
}

export { FilterConditionFields } from './filter-editor.js';
export { createFilterMatcher, matchesFilterCondition } from './filter-matching.js';
export type { FilterRecordValue, FilterValueGetter } from './filter-matching.js';
export { createFilterCondition, isFilterConditionComplete } from './filter-model.js';
export type {
  FilterCondition,
  FilterField,
  FilterFieldType,
  FilterNumberRange,
  FilterOption,
  FilterValue,
} from './filter-model.js';
export type { FilterOperator } from '../../core/strings/query.js';
