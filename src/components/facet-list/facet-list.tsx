'use client';

import { useId, useState, type FocusEvent } from 'react';
import { CheckboxGroup as AriaCheckboxGroup, useNumberFormatter } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { SearchField } from '../search-field/search-field.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { listFacetOptions, type FacetListOption } from './facet-options.js';

export interface FacetListProps extends BaseProps {
  /** The facet's name: the visible heading, which names the group of values. */
  label: string;
  /** The facet's values, in order. */
  options: readonly FacetListOption[];
  /** The ticked values, controlled. */
  value?: readonly string[] | undefined;
  /** The values ticked at first, uncontrolled. */
  defaultValue?: readonly string[] | undefined;
  /** Called with the ticked values, in option order, after each change. */
  onChange?: ((value: string[]) => void) | undefined;
  /** How many values show before the "show more" button. Defaults to 5. */
  limit?: number | undefined;
  /** Draws a search field that narrows the values. Defaults to on for more than 10 values. */
  filterable?: boolean | undefined;
  /** Lists the ticked values first. The order holds while focus is in the list. */
  selectedFirst?: boolean | undefined;
}

const hooks = createHooks('facet-list', [
  'label',
  'search',
  'options',
  'option',
  'option-label',
  'count',
  'empty',
  'toggle',
]);

const emptyValue: readonly string[] = [];

/** The ticked values when focus came into the list, so ticking never moves a value under the reader. */
function useFrozenOrder(value: readonly string[]) {
  const [frozen, setFrozen] = useState<readonly string[] | null>(null);
  return {
    order: frozen ?? value,
    onFocus: () => {
      if (frozen === null) setFrozen(value);
    },
    onBlur: (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFrozen(null);
    },
  };
}

/**
 * The ticked values in option order, then the ticked values no option shows in their previous
 * order: values whose options come and go as counts refresh stay ticked.
 */
function orderTicked(options: readonly FacetListOption[], ticked: readonly string[]): string[] {
  const known = new Set(options.map((option) => option.value));
  return [
    ...options.map((option) => option.value).filter((entry) => ticked.includes(entry)),
    ...ticked.filter((entry) => !known.has(entry)),
  ];
}

/** One value's checkbox, named by its label with its count. */
function FacetOption({
  option,
  format,
}: {
  option: FacetListOption;
  format: (count: number) => string;
}) {
  const strings = useUiStrings();
  const formatted = option.count === undefined ? null : format(option.count);
  return (
    <Checkbox
      size="sm"
      value={option.value}
      isDisabled={option.isDisabled}
      aria-label={formatted === null ? undefined : strings.labelWithCount(option.label, formatted)}
      className={hooks.slotClass('option')}
    >
      <span {...hooks.slot('option-label')}>{option.label}</span>
      {formatted === null ? null : <span {...hooks.slot('count')}>{formatted}</span>}
    </Checkbox>
  );
}

/**
 * The values of one facet as checkboxes with record counts, for narrowing a collection: an optional
 * search within the values, a fold past `limit` with a button to show the rest, and optionally the
 * ticked values first.
 */
export function FacetList({
  label,
  options,
  value: controlledValue,
  defaultValue = emptyValue,
  onChange,
  limit = 5,
  filterable = options.length > 10,
  selectedFirst = false,
  className,
  id,
  ...rest
}: FacetListProps) {
  const strings = useUiStrings();
  const labelId = useId();
  const optionsId = useId();
  const [value, setValue] = useControllableState(controlledValue, defaultValue, (next) =>
    onChange?.([...next]),
  );
  const [query, setQuery] = useState('');
  // A query outlives its field when the options shrink; it must not keep narrowing them unseen.
  const activeQuery = filterable ? query : '';
  const [isExpanded, setExpanded] = useState(false);
  const headingLevel = useHeadingLevel(undefined);
  const frozen = useFrozenOrder(value);
  const { shown, hiddenCount, matchCount } = listFacetOptions({
    options,
    query: activeQuery,
    firstValues: selectedFirst ? frozen.order : null,
    limit,
    isExpanded,
  });
  const count = useNumberFormatter();
  const choose = (ticked: string[]) => setValue(orderTicked(options, ticked));
  const canFold = !activeQuery.trim() && options.length > limit;
  return (
    <div
      {...hooks.root({ className, props: rest, data: { expanded: isExpanded && canFold } })}
      id={id}
      onFocus={frozen.onFocus}
      onBlur={frozen.onBlur}
    >
      <div {...hooks.slot('label')} id={labelId} role="heading" aria-level={headingLevel}>
        {label}
      </div>
      {filterable ? (
        <SearchField
          size="sm"
          label={strings.filterLabel(label)}
          className={hooks.slotClass('search')}
          value={query}
          onChange={setQuery}
        />
      ) : null}
      <AriaCheckboxGroup
        {...hooks.slot('options')}
        id={optionsId}
        aria-labelledby={labelId}
        value={[...value]}
        onChange={choose}
      >
        {shown.map((option) => (
          <FacetOption key={option.value} option={option} format={(value) => count.format(value)} />
        ))}
      </AriaCheckboxGroup>
      {matchCount === 0 ? <p {...hooks.slot('empty')}>{strings.noResults}</p> : null}
      {canFold ? (
        <Button
          variant="ghost"
          size="sm"
          className={hooks.slotClass('toggle')}
          aria-expanded={isExpanded}
          aria-controls={optionsId}
          onPress={() => setExpanded(!isExpanded)}
        >
          {isExpanded ? strings.showLess : strings.showMoreValues(hiddenCount)}
        </Button>
      ) : null}
    </div>
  );
}

export type { FacetListOption } from './facet-options.js';
