'use client';

import { Fragment } from 'react';
import { Input, NumberField as AriaNumberField } from '../../primitives/index.js';
import { type FieldControlProps, type FieldState, toAriaControlProps } from '../field/field.js';
import { numberFieldHooks as hooks } from './number-field-parts.js';

type EndpointValue = number | [number, number];

interface NumberEndpointsProps<T extends EndpointValue> {
  state: FieldState<T>;
  /** The field's control: the first input takes its id and reference only when `ownsControl`. */
  control: FieldControlProps;
  ownsControl: boolean;
  /** The field label; a range's inputs put each end's own name before it. */
  label: string;
  /** Each end's own name, read before the label; a single value has none. */
  endLabels: readonly (string | undefined)[];
  /** The form name each input submits under, when the inputs carry the form value. */
  names: readonly (string | undefined)[];
  rules: { minValue: number; maxValue: number; step: number };
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The value the field takes for a typed end, kept on its grid and the ends in order. */
  normalize: (next: T, previous: T) => T;
}

function toList(value: EndpointValue): number[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * A number input per value, which edits it directly: one for a single value, or the start and the
 * end of a range with a separator between them. A typed number takes effect on Enter, when focus
 * leaves the input and on each arrow step, and commits; the range keeps its ends in order and
 * apart, as the thumbs do.
 */
export function NumberEndpoints<T extends EndpointValue>({
  state,
  control,
  ownsControl,
  label,
  endLabels,
  names,
  rules,
  formatOptions,
  normalize,
}: NumberEndpointsProps<T>) {
  const values = toList(state.value);
  const field = toAriaControlProps(control);
  const isLocked = state.isReadOnly || state.isDisabled;
  const change = (index: number, typed: number) => {
    if (isLocked || Number.isNaN(typed)) return;
    const next = values.map((value, at) => (at === index ? typed : value));
    const given = (Array.isArray(state.value) ? next : next[0]) as T;
    state.setValue(normalize(given, state.value));
    state.commit();
  };
  return (
    <div {...hooks.slot('endpoints')}>
      {values.map((value, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <span {...hooks.slot('separator')} aria-hidden="true">
              –
            </span>
          ) : null}
          <AriaNumberField
            {...hooks.slot('endpoint')}
            id={ownsControl && index === 0 ? field.id : undefined}
            aria-label={[endLabels[index], label].filter(Boolean).join(' ')}
            aria-describedby={field['aria-describedby']}
            aria-errormessage={field['aria-errormessage']}
            isInvalid={field.isInvalid}
            isDisabled={field.isDisabled}
            isReadOnly={state.isReadOnly}
            name={names[index]}
            minValue={rules.minValue}
            maxValue={rules.maxValue}
            step={rules.step}
            formatOptions={formatOptions}
            value={value}
            onChange={(typed) => change(index, typed)}
          >
            <Input
              {...hooks.slot('input')}
              ref={ownsControl && index === 0 ? control.ref : undefined}
            />
          </AriaNumberField>
        </Fragment>
      ))}
    </div>
  );
}
