import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DecimalField, type DecimalFieldProps } from './decimal-field.js';

function spinbutton(name = 'Amount') {
  return screen.getByRole<HTMLInputElement>('spinbutton', { name });
}

function formValue(name: string) {
  const form = screen.getByRole<HTMLFormElement>('form');
  return new FormData(form).get(name);
}

function InForm(props: Partial<DecimalFieldProps>) {
  return (
    <form aria-label="Order">
      <DecimalField label="Amount" name="amount" {...props} />
    </form>
  );
}

describe('DecimalField', () => {
  it('UIC-DECIMAL-FIELD-1.1 UIC-DECIMAL-FIELD-3.3 is a field around a spinbutton that starts empty', () => {
    const ref = vi.fn();
    const { container, rerender } = render(
      <DecimalField label="Amount" ref={ref} className="extra" id="amount" />,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveClass('ui-decimal-field', 'extra');
    expect(root).toHaveAttribute('id', 'amount');
    expect(ref).toHaveBeenCalledWith(root);
    expect(spinbutton()).toHaveValue('');
    expect(spinbutton()).toHaveAttribute('inputmode', 'decimal');
    expectHooksMatchSpec(container, 'DECIMAL-FIELD', {
      slots: ['box', 'group', 'input', 'decrement', 'increment'],
    });
    rerender(<DecimalField label="Amount" data-kind="price" />);
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-kind', 'price');
  });

  it('UIC-DECIMAL-FIELD-1.2 UIC-DECIMAL-FIELD-1.5 round-trips a large integer and a long fraction', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(<InForm onChange={onChange} onCommit={onCommit} />);
    await user.type(spinbutton(), '9007199254740993');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('9007199254740993');
    expect(onCommit).toHaveBeenLastCalledWith('9007199254740993');
    expect(spinbutton()).toHaveValue('9,007,199,254,740,993');
    expect(formValue('amount')).toBe('9007199254740993');
    await user.clear(spinbutton());
    await user.type(spinbutton(), '-0.1000000000000000000000000000001');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith('-0.1000000000000000000000000000001');
    expect(spinbutton()).toHaveValue('-0.1000000000000000000000000000001');
    expect(formValue('amount')).toBe('-0.1000000000000000000000000000001');
  });

  it('UIC-DECIMAL-FIELD-1.2 keeps controlled values exactly and leaves a non-canonical one as given', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>('12345678901234567890.25');
      return (
        <>
          <InForm value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue('1.50')}>
            Preset
          </button>
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(spinbutton()).toHaveValue('12,345,678,901,234,567,890.25');
    await user.click(screen.getByRole('button', { name: 'Preset' }));
    expect(spinbutton()).toHaveValue('1.5');
    await user.click(spinbutton());
    await user.tab();
    expect(screen.getByRole('status')).toHaveTextContent('1.50');
    expect(formValue('amount')).toBe('1.50');
  });

  it('UIC-DECIMAL-FIELD-1.2 reports a given value that is no decimal', () => {
    render(<DecimalField label="Amount" defaultValue="1e5" />);
    expect(spinbutton()).toHaveValue('1e5');
    expect(spinbutton()).toHaveAttribute('aria-invalid', 'true');
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter a decimal number.');
  });

  it('UIC-DECIMAL-FIELD-1.3 reads and writes the locale separators', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="de-DE">
        <DecimalField label="Amount" defaultValue="1234.5" onCommit={onCommit} />
      </UiProvider>,
    );
    expect(spinbutton()).toHaveValue('1.234,5');
    await user.clear(spinbutton());
    await user.type(spinbutton(), '-12.345,678{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('-12345.678');
    expect(spinbutton()).toHaveValue('-12.345,678');
  });

  it('UIC-DECIMAL-FIELD-1.3 pads fraction digits and drops grouping on request', () => {
    render(
      <DecimalField
        label="Amount"
        defaultValue="1234.5"
        formatOptions={{ useGrouping: false, minimumFractionDigits: 2 }}
      />,
    );
    expect(spinbutton()).toHaveValue('1234.50');
  });

  it('UIC-DECIMAL-FIELD-1.4 keeps an unreadable draft apart and reports it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DecimalField label="Amount" defaultValue="2" onChange={onChange} />);
    await user.clear(spinbutton());
    await user.type(spinbutton(), '3..');
    await user.tab();
    expect(spinbutton()).toHaveValue('3..');
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter a decimal number.');
    expect(onChange).not.toHaveBeenCalled();
    await user.click(spinbutton());
    await user.keyboard('{Backspace}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('3');
    expect(spinbutton()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-DECIMAL-FIELD-2.1 UIC-DECIMAL-FIELD-2.5 steps exactly with the arrows and buttons', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <DecimalField label="Amount" step="0.1" minValue="0" maxValue="0.3" onCommit={onCommit} />,
    );
    await user.click(spinbutton());
    await user.keyboard('{ArrowUp}');
    expect(spinbutton()).toHaveValue('0');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('0.3');
    const increase = screen.getByRole('button', { name: 'Increase Amount' });
    expect(increase).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Decrease Amount' }));
    expect(onCommit).toHaveBeenLastCalledWith('0.2');
    expect(spinbutton()).toHaveFocus();
    expect(spinbutton()).toHaveAttribute('aria-valuetext', '0.2');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(spinbutton()).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Decrease Amount' })).toBeDisabled();
  });

  it('UIC-DECIMAL-FIELD-2.2 UIC-DECIMAL-FIELD-2.3 rounds to the scale and snaps or validates', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = render(
      <DecimalField label="Amount" scale={2} step="0.01" maxValue="10" onCommit={onCommit} />,
    );
    await user.type(spinbutton(), '2.345{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('2.35');
    await user.clear(spinbutton());
    await user.type(spinbutton(), '12{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('10');
    rerender(
      <DecimalField
        label="Amount"
        scale={2}
        roundingMode="halfEven"
        step="0.01"
        maxValue="10"
        commitBehavior="validate"
        onCommit={onCommit}
      />,
    );
    await user.clear(spinbutton());
    await user.type(spinbutton(), '2.345{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('2.34');
    await user.clear(spinbutton());
    await user.type(spinbutton(), '12{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('12');
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter 10 or less.');
  });

  it('UIC-DECIMAL-FIELD-2.4 reports range, step and scale errors', () => {
    const { rerender } = render(<DecimalField label="Amount" minValue="1" defaultValue="0.5" />);
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter 1 or more.');
    rerender(<DecimalField label="Amount" step="0.25" defaultValue="0.3" key="step" />);
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter a value in steps of 0.25.');
    rerender(
      <DecimalField label="Amount" step="0.001" scale={2} defaultValue="0.125" key="scale" />,
    );
    expect(spinbutton()).toHaveAccessibleErrorMessage('Enter a value in steps of 0.01.');
    rerender(<DecimalField label="Amount" minValue="1" key="empty" />);
    expect(spinbutton()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-DECIMAL-FIELD-3.1 is a named spinbutton that refuses edits while read-only or disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <DecimalField
        label="Amount"
        description="In units."
        defaultValue="5"
        minValue="0"
        maxValue="10"
        isReadOnly
        onChange={onChange}
      />,
    );
    const input = spinbutton();
    expect(input).toHaveAccessibleDescription('In units.');
    expect(input).toHaveAttribute('aria-valuenow', '5');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    expect(input).toHaveAttribute('readonly');
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('5');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Increase Amount' })).toBeDisabled();
    rerender(<DecimalField label="Amount" defaultValue="5" isDisabled />);
    expect(spinbutton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease Amount' })).toBeDisabled();
    rerender(<DecimalField label="Amount" defaultValue="5" hideStepper />);
    expect(screen.queryByRole('button', { name: 'Increase Amount' })).not.toBeInTheDocument();
  });

  it('UIC-DECIMAL-FIELD-3.2 restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    render(<DecimalField label="Amount" defaultValue="1.25" />);
    await user.click(spinbutton());
    await user.keyboard('{ArrowUp}');
    expect(spinbutton()).toHaveValue('2.25');
    await user.keyboard('{Control>}z{/Control}');
    expect(spinbutton()).toHaveValue('1.25');
    await chooseFieldMenuItem(user, spinbutton(), 'Clear');
    expect(spinbutton()).toHaveValue('');
  });

  it('UIC-DECIMAL-FIELD-1.5 submits nothing while disabled and resets to its first value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <form aria-label="Order">
        <DecimalField label="Amount" name="amount" defaultValue="3.5" />
        <button type="reset">Reset</button>
      </form>,
    );
    await user.click(spinbutton());
    await user.keyboard('{ArrowUp}');
    expect(formValue('amount')).toBe('4.5');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(spinbutton()).toHaveValue('3.5');
    rerender(
      <form aria-label="Order">
        <DecimalField label="Amount" name="amount" defaultValue="3.5" isDisabled />
      </form>,
    );
    expect(formValue('amount')).toBeNull();
  });
});
