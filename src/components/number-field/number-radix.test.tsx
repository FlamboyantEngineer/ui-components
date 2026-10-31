import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { NumberField } from './number-field.js';

describe('NumberField bases', () => {
  it('UIC-NUMBER-FIELD-4.1 UIC-NUMBER-FIELD-4.2 edits prefixed integers, retains numeric form values and includes units', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <form>
        <NumberField
          label="Capacity"
          name="capacity"
          radix={16}
          defaultValue={42}
          endAdornment="B"
          onCommit={onCommit}
        />
      </form>,
    );
    const input = screen.getByRole('spinbutton', { name: 'Capacity' });
    expect(input).toHaveValue('0x2a');
    expect(input).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('B')).toHaveClass('ui-number-field__end');
    await user.clear(input);
    await user.type(input, '0xff{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(255);
    expect(new FormData(requireDefined(container.querySelector('form'))).get('capacity')).toBe(
      '255',
    );
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('0x100');
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { slots: ['input', 'end'] });
  });
  it('UIC-NUMBER-FIELD-4.1 UIC-NUMBER-FIELD-4.2 refuses malformed fractions, snaps bounds and keeps validation and restore', async () => {
    const user = userEvent.setup();
    render(
      <NumberField
        label="Bits"
        radix={2}
        committedValue={8}
        maxValue={16}
        smallStep={1}
        largeStep={4}
      />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Bits' });
    await user.clear(input);
    await user.type(input, '0b1.1{Enter}');
    expect(input).toHaveValue('0b1000');
    await user.clear(input);
    await user.type(input, '111111{Enter}');
    expect(input).toHaveValue('0b10000');
    await user.click(screen.getByRole('button', { name: 'Restore Bits' }));
    expect(input).toHaveValue('0b1000');
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('0b1100');
  });
  it('UIC-NUMBER-FIELD-4.2 keeps externally supplied fractions visible and invalid without rewriting them', () => {
    const { container } = render(<NumberField label="Integer" radix={8} value={1.5} />);
    expect(screen.getByRole('spinbutton', { name: 'Integer' })).toHaveValue('0o1.4');
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-validation', 'invalid');
  });
});

it('UIC-NUMBER-FIELD-4.2 names radix step buttons with provider strings', () => {
  render(
    <UiProvider messages={{ numberIncrease: 'Add', numberDecrease: 'Subtract' }}>
      <NumberField label="Capacity" radix={16} />
    </UiProvider>,
  );
  expect(screen.getByRole('button', { name: 'Add Capacity' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Subtract Capacity' })).toBeEnabled();
});

describe('NumberField base stepping', () => {
  it.each([16, 8, 2] as const)(
    'UIC-NUMBER-FIELD-4.2 steps base %i on the step grid within reachable bounds',
    async (radix) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const { rerender } = render(
        <NumberField
          key="bounded"
          label="Slot"
          radix={radix}
          defaultValue={9}
          minValue={0}
          maxValue={10}
          step={3}
          onCommit={onCommit}
        />,
      );
      const input = screen.getByRole('spinbutton', { name: 'Slot' });
      await user.click(input);
      await user.keyboard('{ArrowUp}');
      expect(input).toHaveAttribute('aria-valuenow', '9');
      rerender(
        <NumberField
          key="off-grid"
          label="Slot"
          radix={radix}
          defaultValue={2}
          minValue={0}
          step={3}
          onCommit={onCommit}
        />,
      );
      await user.click(screen.getByRole('spinbutton', { name: 'Slot' }));
      await user.keyboard('{ArrowUp}');
      expect(onCommit).toHaveBeenLastCalledWith(6);
      await user.keyboard('{Shift>}{ArrowUp}{/Shift}{Alt>}{ArrowDown}{/Alt}');
      expect(onCommit).toHaveBeenCalledTimes(1);
    },
  );

  it('UIC-NUMBER-FIELD-4.2 steps a negative origin and uses configured modifier steps', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <NumberField
        label="Offset"
        radix={16}
        defaultValue={-7}
        minValue={-8}
        step={4}
        largeStep={16}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('spinbutton', { name: 'Offset' });
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith(-4);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(onCommit).toHaveBeenLastCalledWith(12);
  });

  it('UIC-NUMBER-FIELD-4.2 publishes focus on its group as the decimal field does', async () => {
    const user = userEvent.setup();
    const { container } = render(<NumberField label="Mask" radix={16} defaultValue={15} />);
    const group = container.querySelector('.ui-number-field__group');
    expect(group).not.toHaveAttribute('data-focus-within');
    await user.tab();
    expect(group).toHaveAttribute('data-focus-within', 'true');
  });
});
