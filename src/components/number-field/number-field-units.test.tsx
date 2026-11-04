import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { NumberField } from './number-field.js';
import type { NumberFieldUnits } from './unit-number.js';

const lengths: NumberFieldUnits = { unit: 'mm', conversions: { cm: 10, m: 1000 } };

describe('NumberField units', () => {
  it('UIC-NUMBER-FIELD-3.4 commits a decimal comma with grouping disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="de-DE">
        <form aria-label="Measurement">
          <NumberField
            label="Length"
            name="length"
            units={{ unit: 'm', conversions: { m: 1 } }}
            step={0.1}
            formatOptions={{ useGrouping: false }}
            onChange={onChange}
            onCommit={onCommit}
          />
        </form>
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    await user.type(input, '1,5{Enter}');
    expect(input).toHaveValue('1,5');
    expect(input).toHaveAttribute('aria-valuenow', '1.5');
    expect(new FormData(screen.getByRole('form')).get('length')).toBe('1.5');
    expect(onChange).toHaveBeenLastCalledWith(1.5);
    expect(onCommit).toHaveBeenLastCalledWith(1.5);
  });

  it.each(['Enter', 'Tab', 'pointer blur'])(
    'UIC-NUMBER-FIELD-3.4 keeps an untouched negative accounting value on %s',
    async (action) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCommit = vi.fn();
      render(
        <UiProvider locale="en-US">
          <form aria-label="Measurement">
            <NumberField
              label="Amount"
              name="amount"
              defaultValue={-1}
              units={lengths}
              formatOptions={{ style: 'currency', currency: 'USD', currencySign: 'accounting' }}
              onChange={onChange}
              onCommit={onCommit}
            />
            <button type="button">Continue</button>
          </form>
        </UiProvider>,
      );
      const input = screen.getByRole('spinbutton', { name: 'Amount' });
      expect(input).toHaveValue('($1.00)');
      await user.click(input);
      if (action === 'Enter') await user.keyboard('{Enter}');
      if (action === 'Tab') {
        await user.tab();
        // Leave the entire field if its chrome took focus.
        for (
          let i = 0;
          i < 4 && !screen.getByRole('button', { name: 'Continue' }).matches(':focus');
          i++
        )
          await user.tab();
        expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus();
      }
      if (action === 'pointer blur')
        await user.click(screen.getByRole('button', { name: 'Continue' }));
      expect(input).toHaveValue('($1.00)');
      expect(input).toHaveAttribute('aria-valuenow', '-1');
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(new FormData(screen.getByRole('form')).get('amount')).toBe('-1');
      // An untouched value is already committed (UIC-FIELD-2.3).
      expect(onCommit).not.toHaveBeenCalled();
      for (const [value] of onChange.mock.calls) expect(value).toBe(-1);
    },
  );

  it('UIC-NUMBER-FIELD-3.4 keeps malformed accounting text and its previous numeric value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <NumberField
          label="Amount"
          defaultValue={-1}
          units={lengths}
          formatOptions={{ style: 'currency', currency: 'USD', currencySign: 'accounting' }}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Amount' });
    await user.clear(input);
    await user.type(input, '($-1.00){Enter}');
    expect(input).toHaveValue('($-1.00)');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a number in mm, cm, or m.');
    expect(input).toHaveAttribute('aria-valuenow', '-1');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-NUMBER-FIELD-3.4 converts a typed quantity to the field unit on commit', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <form aria-label="Part">
        <NumberField label="Length" name="length" units={lengths} onCommit={onCommit} />
      </form>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    expect(container.querySelector('.ui-number-field__end')).toHaveTextContent('mm');
    await user.type(input, '5cm{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(50);
    expect(input).toHaveValue('50');
    expect(input).toHaveAttribute('aria-valuetext', '50 mm');
    expect(new FormData(screen.getByRole('form')).get('length')).toBe('50');
    // Editing the value: a number alone is in the field's unit, and pasting works too.
    await user.clear(input);
    await user.paste('0.25 m');
    await user.tab();
    expect(input).toHaveValue('250');
    await user.click(document.body);
    expect(onCommit).toHaveBeenLastCalledWith(250);
    await user.click(input);
    await user.clear(input);
    await user.type(input, '1,234.5{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(1234.5);
    expect(input).toHaveValue('1,234.5');
  });

  it('UIC-NUMBER-FIELD-3.4 keeps unreadable text and reports the units it reads', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField label="Length" defaultValue={12} units={lengths} onCommit={onCommit} />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    await user.clear(input);
    await user.type(input, '5 km{Enter}');
    expect(input).toHaveValue('5 km');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Enter a number in mm, cm, or m.',
    );
    expect(onCommit).not.toHaveBeenCalledWith(expect.anything());
    await user.clear(input);
    await user.type(input, '5 cm{Enter}');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(onCommit).toHaveBeenLastCalledWith(50);
  });

  it('UIC-NUMBER-FIELD-3.4 steps, snaps, restores and follows the locale', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UiProvider locale="fr-FR">
        <NumberField
          label="Length"
          defaultValue={10}
          maxValue={100}
          step={5}
          units={lengths}
          endAdornment="millimètres"
        />
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    expect(container.querySelector('.ui-number-field__end')).toHaveTextContent('millimètres');
    await user.clear(input);
    await user.type(input, '2,2 cm{Enter}');
    // Snapped onto the step from 22.
    expect(input).toHaveValue('20');
    await user.clear(input);
    await user.type(input, '3 cm{ArrowUp}');
    expect(input).toHaveValue('35');
    await user.clear(input);
    await user.type(input, '1 m{Enter}');
    expect(input).toHaveValue('100');
  });

  it('UIC-NUMBER-FIELD-3.4 reads back its own localized and percent values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UiProvider locale="ar-EG">
        <NumberField label="Length" defaultValue={10} units={lengths} onChange={onChange} />
        <NumberField
          label="Share"
          value={0.25}
          units={{ unit: 'of total', conversions: {} }}
          formatOptions={{ style: 'percent' }}
          onChange={onChange}
        />
      </UiProvider>,
    );
    const length = screen.getByRole('spinbutton', { name: 'Length' });
    const share = screen.getByRole('spinbutton', { name: 'Share' });
    expect(length).toHaveValue('١٠');
    // Untouched values stay valid through focus and blur.
    await user.click(share);
    await user.click(length);
    await user.tab();
    expect(length).not.toHaveAttribute('aria-invalid');
    expect(share).not.toHaveAttribute('aria-invalid');
    // Blur may report a value again, but never another one.
    for (const [value] of onChange.mock.calls) expect([10, 0.25]).toContain(value);
    await user.clear(length);
    await user.type(length, '١٫٢ cm');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(length).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-NUMBER-FIELD-3.4 writes a compact-notation quantity in standard notation and refuses 12K', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <NumberField
          label="Length"
          defaultValue={12_000}
          units={{ unit: 'm', conversions: { m: 1 } }}
          formatOptions={{ notation: 'compact', compactDisplay: 'long' }}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    expect(input).toHaveValue('12,000');
    await user.click(input);
    await user.tab();
    expect(input).not.toHaveAttribute('aria-invalid');
    await user.clear(input);
    await user.type(input, '12K{Enter}');
    expect(onCommit).not.toHaveBeenCalledWith(12);
    expect(input).toHaveValue('12K');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-valuenow', '12000');
    await user.clear(input);
    await user.type(input, '12.5{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(12.5);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it.each(['Enter', 'Tab', 'blur'])(
    'UIC-NUMBER-FIELD-3.4 reads back an Arabic scientific quantity on %s',
    async (action) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const onChange = vi.fn();
      render(
        <UiProvider locale="ar-EG">
          <NumberField
            label="Length"
            defaultValue={12_000}
            units={{ unit: 'm', conversions: { m: 1 } }}
            formatOptions={{ notation: 'scientific' }}
            onChange={onChange}
            onCommit={onCommit}
          />
          <button type="button">Continue</button>
        </UiProvider>,
      );
      const input = screen.getByRole('spinbutton', { name: 'Length' });
      const formatted = new Intl.NumberFormat('ar-EG', { notation: 'scientific' }).format(12_000);
      expect(input).toHaveValue(formatted);
      const finish = async () => {
        if (action === 'Enter') await user.keyboard('{Enter}');
        else if (action === 'Tab') await user.tab();
        else await user.click(screen.getByRole('button', { name: 'Continue' }));
      };
      await user.click(input);
      await finish();
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).toHaveAttribute('aria-valuenow', '12000');
      await user.clear(input);
      await user.type(input, '٢٫٥أس-٣');
      await finish();
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).toHaveAttribute('aria-valuenow', '0.0025');
      expect(onChange).toHaveBeenLastCalledWith(0.0025);
      for (const [value] of onCommit.mock.calls) expect([12_000, 0.0025]).toContain(value);
    },
  );
});

describe('NumberField units precision', () => {
  const metres: NumberFieldUnits = { unit: 'm', conversions: { m: 1 } };

  it('UIC-NUMBER-FIELD-2.2 keeps a typed precise value through Enter and a later blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <form aria-label="Measurement">
          <NumberField
            label="Length"
            name="length"
            commitBehavior="validate"
            units={metres}
            onChange={onChange}
            onCommit={onCommit}
          />
        </form>
        <button type="button">Continue</button>
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    await user.type(input, '1.23456{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(1.23456);
    expect(input).toHaveValue('1.235');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(input);
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(input).toHaveAttribute('aria-valuenow', '1.23456');
    expect(new FormData(screen.getByRole('form')).get('length')).toBe('1.23456');
    for (const [value] of [...onChange.mock.calls, ...onCommit.mock.calls]) {
      expect(value).toBe(1.23456);
    }
  });

  it.each(['uncontrolled', 'controlled'])(
    'UIC-NUMBER-FIELD-3.4 keeps an untouched %s precise value through focus and blur',
    async (mode) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<number | null>(1.23456);
        return (
          <NumberField
            label="Length"
            units={metres}
            commitBehavior="validate"
            value={value}
            onChange={(next) => {
              onChange(next);
              setValue(next);
            }}
          />
        );
      }
      render(
        <UiProvider locale="en-US">
          {mode === 'controlled' ? (
            <Controlled />
          ) : (
            <NumberField
              label="Length"
              units={metres}
              commitBehavior="validate"
              defaultValue={1.23456}
              onChange={onChange}
            />
          )}
          <button type="button">Continue</button>
        </UiProvider>,
      );
      const input = screen.getByRole('spinbutton', { name: 'Length' });
      for (let round = 0; round < 2; round++) {
        await user.click(input);
        await user.keyboard('{Enter}');
        await user.click(screen.getByRole('button', { name: 'Continue' }));
      }
      expect(input).toHaveValue('1.235');
      expect(input).toHaveAttribute('aria-valuenow', '1.23456');
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it('UIC-NUMBER-FIELD-2.2 still snaps an untouched value off the step grid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UiProvider locale="en-US">
        <NumberField
          label="Length"
          units={metres}
          step={0.5}
          defaultValue={1.23456}
          onChange={onChange}
        />
      </UiProvider>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Length' });
    await user.click(input);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(input).toHaveAttribute('aria-valuenow', '1');
  });
});
