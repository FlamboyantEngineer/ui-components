import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DecreaseFontSizeGlyph, IncreaseFontSizeGlyph } from '../../core/drawn-glyphs.js';
import { type NumberEntryFieldProps, NumberField } from './number-field.js';
import { findStepValue } from './step-values.js';

const fontSizes = [8, 9, 10, 11, 12, 14, 18, 24, 36] as const;

function renderSize(props: Partial<NumberEntryFieldProps> = {}) {
  const onChange = vi.fn();
  const onCommit = vi.fn();
  render(
    <NumberField
      label="Size"
      stepValues={fontSizes}
      onChange={onChange}
      onCommit={onCommit}
      {...props}
    />,
  );
  return {
    input: screen.getByRole('textbox', { name: 'Size' }),
    increase: screen.getByRole('button', { name: 'Increase Size' }),
    decrease: screen.getByRole('button', { name: 'Decrease Size' }),
    onChange,
    onCommit,
  };
}

describe('findStepValue', () => {
  it('UIC-NUMBER-FIELD-3.5 finds the next preset either way, sorted and within the range', () => {
    const list = { values: [24, 8, 12, 10, Number.NaN] };
    expect(findStepValue(10, 1, list)).toBe(12);
    expect(findStepValue(10, -1, list)).toBe(8);
    expect(findStepValue(13, 1, list)).toBe(24);
    expect(findStepValue(13, -1, list)).toBe(12);
    expect(findStepValue(24, 1, list)).toBeNull();
    expect(findStepValue(8, -1, list)).toBeNull();
    expect(findStepValue(null, 1, list)).toBe(8);
    expect(findStepValue(null, -1, list)).toBe(24);
    expect(findStepValue(0.30000000000000004, 1, { values: [0.1, 0.3, 0.5] })).toBe(0.5);
    const bounded = { values: [8, 10, 12, 24], minValue: 9, maxValue: 20 };
    expect(findStepValue(null, 1, bounded)).toBe(10);
    expect(findStepValue(12, 1, bounded)).toBeNull();
  });
});

describe('NumberField with stepValues', () => {
  it('UIC-NUMBER-FIELD-3.5 steps through the presets with the buttons and commits each step', async () => {
    const user = userEvent.setup();
    const { input, increase, decrease, onChange, onCommit } = renderSize({ defaultValue: 11 });
    await user.click(increase);
    expect(input).toHaveValue('12');
    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(onCommit).toHaveBeenLastCalledWith(12);
    await user.click(increase);
    expect(input).toHaveValue('14');
    await user.click(decrease);
    await user.click(decrease);
    await user.click(decrease);
    expect(input).toHaveValue('10');
    expect(onChange).toHaveBeenCalledTimes(5);
    expect(input).toHaveFocus();
  });

  it('UIC-NUMBER-FIELD-3.5 moves a typed value between presets to the nearest one each way', async () => {
    const user = userEvent.setup();
    const { input, increase, decrease } = renderSize();
    await user.type(input, '13');
    await user.click(increase);
    expect(input).toHaveValue('14');
    await user.clear(input);
    await user.type(input, '13');
    await user.click(decrease);
    expect(input).toHaveValue('12');
  });

  it('UIC-NUMBER-FIELD-3.5 steps with the plain arrows and keeps Shift for the large step', async () => {
    const user = userEvent.setup();
    const { input, onCommit } = renderSize({ defaultValue: 12, largeStep: 5 });
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('14');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('11');
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('16');
    expect(onCommit).toHaveBeenLastCalledWith(16);
  });

  it('UIC-NUMBER-FIELD-3.5 keeps a typed value off the presets without step', async () => {
    const user = userEvent.setup();
    const { input, onChange } = renderSize();
    await user.type(input, '13.5');
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('13.5');
    expect(onChange).toHaveBeenLastCalledWith(13.5);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-NUMBER-FIELD-3.5 starts an empty value at the first or last preset', async () => {
    const user = userEvent.setup();
    render(<NumberField label="Up" stepValues={fontSizes} />);
    await user.click(screen.getByRole('button', { name: 'Increase Up' }));
    expect(screen.getByRole('textbox', { name: 'Up' })).toHaveValue('8');
    render(<NumberField label="Down" stepValues={fontSizes} />);
    await user.click(screen.getByRole('button', { name: 'Decrease Down' }));
    expect(screen.getByRole('textbox', { name: 'Down' })).toHaveValue('36');
  });

  it('UIC-NUMBER-FIELD-3.5 disables the button past the last preset, within the range', async () => {
    const user = userEvent.setup();
    const { input, increase, decrease } = renderSize({ defaultValue: 24, maxValue: 30 });
    expect(increase).toBeDisabled();
    expect(decrease).toBeEnabled();
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('24');
    await user.clear(input);
    await user.type(input, '7');
    expect(decrease).toBeDisabled();
    expect(increase).toBeEnabled();
  });

  it('UIC-NUMBER-FIELD-3.5 refuses the steps while read-only', async () => {
    const user = userEvent.setup();
    const { input, onChange } = renderSize({ defaultValue: 12, isReadOnly: true });
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('12');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-NUMBER-FIELD-3.5 steps by step with an empty list', async () => {
    const user = userEvent.setup();
    const { input, increase } = renderSize({ stepValues: [], defaultValue: 13 });
    await user.click(increase);
    expect(input).toHaveValue('14');
    await user.click(increase);
    expect(input).toHaveValue('15');
  });

  it('UIC-NUMBER-FIELD-3.6 draws the given step button glyphs in every base', () => {
    const { increase, decrease } = renderSize({
      decrementIcon: DecreaseFontSizeGlyph,
      incrementIcon: IncreaseFontSizeGlyph,
    });
    expect(decrease.querySelector('.ui-glyph')).toHaveAttribute('data-glyph', 'decrease-font-size');
    expect(increase.querySelector('.ui-glyph')).toHaveAttribute('data-glyph', 'increase-font-size');
    expect(decrease).toHaveClass('ui-number-field__decrement');
    render(
      <NumberField
        label="Mask"
        radix={16}
        decrementIcon={DecreaseFontSizeGlyph}
        incrementIcon={IncreaseFontSizeGlyph}
      />,
    );
    const hex = screen.getByRole('button', { name: 'Increase Mask' });
    expect(hex.querySelector('.ui-glyph')).toHaveAttribute('data-glyph', 'increase-font-size');
    render(<NumberField label="Plain" />);
    expect(
      screen.getByRole('button', { name: 'Increase Plain' }).querySelector('.ui-glyph'),
    ).toHaveAttribute('data-glyph', 'plus');
  });
});
