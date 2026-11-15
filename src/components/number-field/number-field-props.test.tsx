import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type NumberDecimalFieldProps,
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
      | NumberEntryFieldProps
      | NumberSliderFieldProps
      | NumberRangeFieldProps
      | NumberDecimalFieldProps
    >();
    const modes: NumberFieldProps[] = [
      { label: 'Quantity', valueType: 'number', value: 2 },
      { label: 'Exact quantity', valueType: 'decimal', value: '9007199254740993' },
      { label: 'Volume', display: 'slider', value: 2 },
      { label: 'Price', range: true, value: [1, 4] },
    ];
    // @ts-expect-error A slider always holds a number, never null.
    const emptySlider: NumberFieldProps = { label: 'Volume', display: 'slider', value: null };
    // @ts-expect-error A range holds a start and an end, not a number.
    const numberRange: NumberFieldProps = { label: 'Price', range: true, value: 3 };
    // @ts-expect-error A number input does not hold a range.
    const rangeEntry: NumberFieldProps = { label: 'Price', value: [1, 4] };
    // @ts-expect-error A decimal value reads in base 10 only; the error points at `radix`.
    const decimalRadix: NumberFieldProps = { label: 'Exact', valueType: 'decimal', radix: 16 };
    // @ts-expect-error A decimal value is never a slider; the error names `display`.
    const decimalSlider: NumberFieldProps = {
      label: 'Exact',
      valueType: 'decimal',
      display: 'slider',
    };
    expect([emptySlider, numberRange, rangeEntry, decimalRadix, decimalSlider]).toHaveLength(5);
    render(
      <>
        {modes.map((props) => (
          <WrappedField key={String(props.label)} {...props} />
        ))}
      </>,
    );
    expect(screen.getByRole('spinbutton', { name: 'Exact quantity' })).toHaveValue(
      '9,007,199,254,740,993',
    );
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('2');
    expect(screen.getByRole('textbox', { name: 'Minimum Price' })).toHaveValue('1');
    expect(screen.getByRole('textbox', { name: 'Maximum Price' })).toHaveValue('4');
  });
});

// These assignments exercise the public discriminant and contextual callback inference.
const decimalProps: NumberFieldProps = {
  label: 'Exact',
  valueType: 'decimal',
  value: '0.1',
  onChange: (value) => {
    expectTypeOf(value).toEqualTypeOf<string | null>();
  },
  onCommit: (value) => {
    expectTypeOf(value).toEqualTypeOf<string | null>();
  },
};
const numericProps: NumberFieldProps = {
  label: 'Numeric',
  value: 0.1,
  onChange: (value) => {
    expectTypeOf(value).toEqualTypeOf<number | null>();
  },
};
it('UIC-NUMBER-FIELD-9.1 types decimal and numeric callbacks without a mixed value', () => {
  expect([decimalProps, numericProps]).toHaveLength(2);
  expectTypeOf<{
    label: string;
    valueType: 'decimal';
    display: 'slider';
    value: string;
  }>().not.toExtend<NumberFieldProps>();
  expectTypeOf<{
    label: string;
    valueType: 'decimal';
    range: true;
    value: [number, number];
  }>().not.toExtend<NumberFieldProps>();
  expectTypeOf<{
    label: string;
    valueType: 'decimal';
    radix: 16;
    value: string;
  }>().not.toExtend<NumberFieldProps>();
  expectTypeOf<{ label: string; value: string }>().not.toExtend<NumberFieldProps>();
  expectTypeOf<{ label: string; value: number; scale: number }>().not.toExtend<NumberFieldProps>();
});

it('UIC-NUMBER-FIELD-9.1 rejects numeric callbacks and units in exact mode', () => {
  expectTypeOf<{
    label: string;
    valueType: 'decimal';
    onChange: (value: number | null) => void;
  }>().not.toExtend<NumberFieldProps>();
  expectTypeOf<{
    label: string;
    valueType: 'decimal';
    units: { unit: string; conversions: Record<string, number> };
  }>().not.toExtend<NumberFieldProps>();
});
