import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type NumberEntryFieldProps,
  NumberField,
  type NumberFieldProps,
  type NumberRangeFieldProps,
  type NumberSliderFieldProps,
} from './number-field.js';

/** A wrapper that forwards whatever mode it is given, as a component registry does. */
function WrappedField(props: ComponentProps<typeof NumberField>) {
  return <NumberField {...props} />;
}

describe('NumberField props', () => {
  it('UIC-NUMBER-FIELD-1.1 types every mode in one union that a wrapper forwards', () => {
    expectTypeOf<ComponentProps<typeof NumberField>>().toEqualTypeOf<NumberFieldProps>();
    expectTypeOf<NumberFieldProps>().toEqualTypeOf<
      NumberEntryFieldProps | NumberSliderFieldProps | NumberRangeFieldProps
    >();
    const modes: NumberFieldProps[] = [
      { label: 'Quantity', value: 2 },
      { label: 'Volume', display: 'slider', value: 2 },
      { label: 'Price', range: true, value: [1, 4] },
    ];
    // @ts-expect-error A slider always holds a number, never null.
    const emptySlider: NumberFieldProps = { label: 'Volume', display: 'slider', value: null };
    // @ts-expect-error A range holds a start and an end, not a number.
    const numberRange: NumberFieldProps = { label: 'Price', range: true, value: 3 };
    // @ts-expect-error A number input does not hold a range.
    const rangeEntry: NumberFieldProps = { label: 'Price', value: [1, 4] };
    expect([emptySlider, numberRange, rangeEntry]).toHaveLength(3);
    render(
      <>
        {modes.map((props) => (
          <WrappedField key={String(props.label)} {...props} />
        ))}
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('2');
    expect(screen.getByRole('textbox', { name: 'Minimum Price' })).toHaveValue('1');
    expect(screen.getByRole('textbox', { name: 'Maximum Price' })).toHaveValue('4');
  });
});
