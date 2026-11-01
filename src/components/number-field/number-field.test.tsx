import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { NumberField, type NumberFieldProps } from './number-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function message(container: HTMLElement) {
  return container.querySelector('.ui-field__message')?.textContent;
}

/**
 * Fires one pointer event with its pointer id: user-event drives a single mouse and cannot cancel
 * a pointer, which these scrub tests need.
 */
function pointer(
  type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel',
  target: Element,
  clientX: number,
  pointerId = 3,
) {
  fireEvent[type](target, { clientX, pointerId, button: 0, isPrimary: true });
}

function SavedField(props: Omit<NumberFieldProps, 'label'>) {
  const [saved, setSaved] = useState<number | null>(4);
  return <NumberField label="Weight" committedValue={saved} onCommit={setSaved} {...props} />;
}

describe('NumberField', () => {
  it('UIC-NUMBER-FIELD-1.4 keeps a read-only off-step external value on blur and Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <NumberField
        label="Weight"
        value={2.7}
        step={0.5}
        isReadOnly
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Weight' });
    await user.click(input);
    await user.keyboard('{Enter}');
    await user.tab();
    expect(input).toHaveValue('2.7');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-NUMBER-FIELD-1.1 is a field around a number field that starts empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<NumberField label="Weight" onChange={onChange} />);
    expect(root(container)).toHaveClass('ui-field', 'ui-number-field');
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toHaveValue('');
    await user.type(input, '12');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(12);
    await user.clear(input);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(null);
    expectHooksMatchSpec(container, 'NUMBER-FIELD', {
      slots: ['box', 'group', 'decrement', 'input', 'increment'],
    });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control'] });
  });

  it('UIC-NUMBER-FIELD-1.1 reads a non-finite value as empty in every radix', () => {
    const givens = ['value', 'defaultValue', 'committedValue'] as const;
    for (const radix of [2, 8, 10, 16] as const) {
      for (const number of [Number.NaN, Infinity, -Infinity]) {
        for (const given of givens) {
          const { container, unmount } = render(
            <form aria-label="Order">
              <NumberField
                label="Count"
                name="count"
                radix={radix}
                isRequired
                {...{ [given]: number }}
              />
            </form>,
          );
          const role = radix === 10 ? 'textbox' : 'spinbutton';
          expect(screen.getByRole(role, { name: 'Count' })).toHaveValue('');
          expect(root(container)).not.toHaveAttribute('data-filled');
          expect(root(container)).toHaveAttribute('data-validation', 'invalid');
          const form = screen.getByRole('form', { name: 'Order' }) as HTMLFormElement;
          expect(new FormData(form).getAll('count').filter(Boolean)).toEqual([]);
          unmount();
        }
      }
    }
    const { container } = render(<NumberField label="Count" value={Infinity} maxValue={10} />);
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-NUMBER-FIELD-1.2 formats and parses in the provider locale', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="de-DE">
        <NumberField
          label="Price"
          defaultValue={1234.5}
          formatOptions={{ style: 'currency', currency: 'EUR' }}
          placeholder="0,00 €"
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    const input = screen.getByRole('textbox', { name: 'Price' });
    expect(input).toHaveValue('1.234,50\u00a0€');
    expect(input).toHaveAttribute('placeholder', '0,00 €');
    expect(input).toHaveAttribute('type', 'text');
    await user.clear(input);
    await user.type(input, '2.500,25x');
    expect(input).toHaveValue('2.500,25');
    // Tab reaches the restore button inside the field; leaving the field commits.
    await user.tab();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith(2500.25);
    expect(input).toHaveValue('2.500,25\u00a0€');
  });

  it('UIC-NUMBER-FIELD-1.3 steps with named buttons and the arrow keys', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, unmount } = render(
      <NumberField label="Weight" defaultValue={9} maxValue={10} onCommit={onCommit} />,
    );
    const increase = screen.getByRole('button', { name: 'Increase Weight' });
    const decrease = screen.getByRole('button', { name: 'Decrease Weight' });
    expect(increase).toHaveAttribute('tabindex', '-1');
    expect(decrease.querySelector('[data-glyph="minus"]')).not.toBeNull();
    expect(increase.querySelector('[data-glyph="plus"]')).not.toBeNull();
    await user.click(increase);
    expect(onCommit).toHaveBeenLastCalledWith(10);
    expect(increase).toBeDisabled();
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('9');
    expect(root(container)).not.toHaveAttribute('data-hide-stepper');
    unmount();

    const view = render(<NumberField label="Weight" defaultValue={2} step={2} hideStepper />);
    expect(screen.queryByRole('button', { name: 'Increase Weight' })).not.toBeInTheDocument();
    expect(root(view.container)).toHaveAttribute('data-hide-stepper', 'true');
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('textbox')).toHaveValue('4');
    expectHooksMatchSpec(view.container, 'NUMBER-FIELD', { slots: ['box', 'group', 'input'] });
  });

  it('UIC-NUMBER-FIELD-1.4 names, describes and locks the input', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <NumberField id="weight" label="Weight" description="In kilograms." isRequired />,
    );
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-errormessage', 'weight-message');
    expect(input).toHaveAccessibleDescription('In kilograms. A value is required.');
    rerender(<NumberField id="weight" label="Weight" value={3} isReadOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(screen.getByRole('textbox')).toHaveValue('3');
    rerender(<NumberField id="weight" label="Weight" value={3} isDisabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('UIC-NUMBER-FIELD-1.5 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <NumberField id="weight" label="Weight" className="narrow" data-test="weight" />,
    );
    expect(root(container)).toHaveClass('ui-number-field', 'narrow');
    expect(root(container)).toHaveAttribute('data-test', 'weight');
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'weight-control');
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-NUMBER-FIELD-2.1 keeps typed text apart from the value until it commits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(<NumberField label="Weight" onChange={onChange} onCommit={onCommit} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '-');
    await user.type(input, '1.');
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(-1);
    expect(onCommit).toHaveBeenLastCalledWith(-1);
  });

  it('UIC-NUMBER-FIELD-2.1 replaces the text with a value set from outside the input', () => {
    const { rerender } = render(<NumberField label="Weight" value={4} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('4');
    rerender(<NumberField label="Weight" value={7} />);
    expect(input).toHaveValue('7');
    rerender(<NumberField label="Weight" value={null} />);
    expect(input).toHaveValue('');
  });

  it('UIC-NUMBER-FIELD-2.2 clamps and snaps by default', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <NumberField label="Weight" minValue={0} maxValue={10} step={0.5} onCommit={onCommit} />,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '12');
    await user.tab();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith(10);
    await user.clear(input);
    await user.type(input, '3.3');
    await user.tab();
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith(3.5);
  });

  it('UIC-NUMBER-FIELD-2.2 reports values outside the range or off the step', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <NumberField
        label="Weight"
        commitBehavior="validate"
        minValue={1}
        maxValue={10}
        step={0.5}
        formatOptions={{ minimumFractionDigits: 1 }}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '12');
    await user.tab();
    expect(message(container)).toBe('Enter 10.0 or less.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.clear(input);
    await user.type(input, '0.5');
    await user.tab();
    expect(message(container)).toBe('Enter 1.0 or more.');
    await user.clear(input);
    await user.type(input, '1.7');
    await user.tab();
    expect(message(container)).toBe('Enter a value in steps of 0.5.');
    await user.clear(input);
    await user.type(input, '2.5');
    await user.tab();
    expect(root(container)).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-NUMBER-FIELD-2.1 UIC-NUMBER-FIELD-2.2 shows external values without hiding their validation errors', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const props = { label: 'Weight', minValue: 0, maxValue: 10, step: 0.5, onChange, onCommit };
    const { container, rerender } = render(<NumberField {...props} value={12} />);
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toHaveValue('12');
    expect(message(container)).toBe('Enter 10 or less.');
    rerender(<NumberField {...props} value={-2} />);
    expect(input).toHaveValue('-2');
    expect(message(container)).toBe('Enter 0 or more.');
    rerender(<NumberField {...props} value={3.3} />);
    expect(input).toHaveValue('3.3');
    expect(message(container)).toBe('Enter a value in steps of 0.5.');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each(['blur', 'Enter'])(
    'UIC-NUMBER-FIELD-2.2 snaps an unchanged external value on %s',
    async (action) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Weight"
          defaultValue={12}
          minValue={0}
          maxValue={10}
          onCommit={onCommit}
        />,
      );
      const input = screen.getByRole('textbox', { name: 'Weight' });
      expect(input).toHaveValue('12');
      await user.click(input);
      if (action === 'blur') await user.tab();
      else await user.keyboard('{Enter}');
      expect(input).toHaveValue('10');
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(10);
    },
  );

  it('UIC-NUMBER-FIELD-2.3 shows warnings and pending checks', () => {
    const { container, rerender } = render(
      <NumberField
        label="Weight"
        defaultValue={90}
        validate={(value) =>
          value !== null && value > 50 ? { severity: 'warning', message: 'Heavy.' } : null
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(message(container)).toBe('Heavy.');
    rerender(<NumberField label="Weight" defaultValue={90} isPending />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
  });

  it('UIC-NUMBER-FIELD-2.3 shows dirty state, restores, undoes and redoes', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField label="Weight" committedValue={4} defaultValue={4} onCommit={onCommit} />,
    );
    const input = screen.getByRole('textbox');
    await user.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(onCommit).toHaveBeenLastCalledWith(5);
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Weight' }));
    expect(input).toHaveValue('4');
    expect(input).toHaveFocus();
    await user.keyboard('{Control>}z{/Control}');
    expect(input).toHaveValue('5');
    await user.keyboard('{Control>}y{/Control}');
    expect(input).toHaveValue('4');
  });

  it('UIC-NUMBER-FIELD-2.3 clears and sets the default from the field menu', async () => {
    const user = userEvent.setup();
    const { container } = render(<SavedField defaultValue={2} menu={['clear', 'set-default']} />);
    const input = screen.getByRole('textbox');
    await user.click(screen.getByRole('button', { name: 'Weight actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(input).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Weight actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Set to default' }));
    expect(input).toHaveValue('2');
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-NUMBER-FIELD-3.1 draws zero affixes and skips empty ones', () => {
    const { container, rerender } = render(
      <NumberField label="Weight" startAdornment={0} endAdornment={0} />,
    );
    expect(container.querySelector('.ui-number-field__start')).toHaveTextContent('0');
    expect(container.querySelector('.ui-number-field__end')).toHaveTextContent('0');
    rerender(<NumberField label="Weight" startAdornment={false} endAdornment={null} />);
    expect(container.querySelector('.ui-number-field__start')).toBeNull();
    expect(container.querySelector('.ui-number-field__end')).toBeNull();
  });

  it.each<Partial<NumberFieldProps>>([{}, { radix: 16 }])(
    'UIC-NUMBER-FIELD-3.1 takes a free button in an affix (%j)',
    async (props) => {
      const user = userEvent.setup();
      const onPress = vi.fn();
      render(
        <NumberField
          label="Length"
          defaultValue={4}
          {...props}
          endAdornment={
            <Button variant="ghost" size="xs" onPress={onPress}>
              Units
            </Button>
          }
        />,
      );
      await user.click(screen.getByRole('button', { name: 'Units' }));
      expect(onPress).toHaveBeenCalledOnce();
      expect(screen.getAllByRole('button', { name: /^Increase/ })).toHaveLength(1);
    },
  );

  it('UIC-NUMBER-FIELD-3.1 frames literal affixes with the number', () => {
    const { container } = render(
      <NumberField label="Rent" defaultValue={1000} startAdornment="$" endAdornment="/mo" />,
    );
    const group = container.querySelector('.ui-number-field__group');
    expect([...(group?.children ?? [])].map((node) => node.className.split(' ')[0])).toEqual([
      'ui-number-field__decrement',
      'ui-number-field__start',
      'ui-number-field__input',
      'ui-number-field__end',
      'ui-number-field__increment',
    ]);
    expect(container.querySelector('.ui-number-field__start')).toHaveTextContent('$');
    expect(container.querySelector('.ui-number-field__end')).toHaveTextContent('/mo');
    expect(screen.getByRole('textbox', { name: 'Rent' })).toHaveValue('1,000');
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { slots: ['start', 'end'] });
  });

  it('UIC-NUMBER-FIELD-3.2 steps by largeStep with Shift and smallStep with Alt', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = render(
      <NumberField
        label="Weight"
        defaultValue={4}
        maxValue={20}
        smallStep={0.1}
        largeStep={10}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('14');
    expect(onCommit).toHaveBeenLastCalledWith(14);
    await user.keyboard('{Alt>}{ArrowDown}{ArrowDown}{ArrowDown}{/Alt}');
    expect(input).toHaveValue('13.7');
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('20');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('19');
    // An input method composing in the input owns its arrows.
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true, isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set a key code on a keydown
    fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true, keyCode: 229 });
    expect(input).toHaveValue('19');
    expect(onCommit).toHaveBeenLastCalledWith(19);
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(input).toHaveValue('9');
    rerender(<NumberField label="Weight" value={4} largeStep={10} isReadOnly />);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('4');
    rerender(<NumberField label="Weight" value={4} />);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(input).toHaveValue('4');
  });

  it.each([
    { keys: '{Shift>}{ArrowUp}{/Shift}', expected: 30 },
    { keys: '{Alt>}{ArrowUp}{/Alt}', expected: 20.1 },
    { keys: '{Shift>}{ArrowDown}{/Shift}', expected: 10 },
    { keys: '{Alt>}{ArrowDown}{/Alt}', expected: 19.9 },
  ])('UIC-NUMBER-FIELD-3.2 steps the typed number with $keys', async ({ keys, expected }) => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <NumberField
        label="Weight"
        defaultValue={5}
        smallStep={0.1}
        largeStep={10}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '20');
    await user.keyboard(keys);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith(expected);
    expect(input).toHaveValue(String(expected));
  });

  it('UIC-NUMBER-FIELD-3.2 steps from the start when the typed text is empty or partial', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="de-DE">
        <NumberField
          label="Weight"
          defaultValue={10}
          minValue={2}
          largeStep={10}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(onCommit).toHaveBeenLastCalledWith(2);
    await user.clear(input);
    await user.type(input, '2,5');
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(onCommit).toHaveBeenLastCalledWith(12.5);
  });

  it.each([10, 16] as const)(
    'UIC-NUMBER-FIELD-3.2 steps by the modifier step when a step button is pressed with Shift or Alt (radix %i)',
    async (radix) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <NumberField
          label="Weight"
          radix={radix}
          defaultValue={4}
          maxValue={40}
          smallStep={radix === 10 ? 0.5 : 2}
          largeStep={10}
          onCommit={onCommit}
        />,
      );
      const input = screen.getByRole(radix === 10 ? 'textbox' : 'spinbutton');
      const increase = screen.getByRole('button', { name: /Increase/ });
      const decrease = screen.getByRole('button', { name: /Decrease/ });
      const shown = (value: number) => (radix === 10 ? String(value) : `0x${value.toString(16)}`);
      await user.keyboard('{Shift>}');
      await user.click(increase);
      await user.click(increase);
      await user.keyboard('{/Shift}');
      expect(input).toHaveValue(shown(24));
      expect(onCommit).toHaveBeenLastCalledWith(24);
      expect(onCommit).toHaveBeenCalledTimes(2);
      await user.keyboard('{Alt>}');
      await user.click(decrease);
      await user.keyboard('{/Alt}');
      const altered = radix === 10 ? 23.5 : 22;
      expect(input).toHaveValue(shown(altered));
      // Shift wins over Alt.
      await user.keyboard('{Shift>}{Alt>}');
      await user.click(increase);
      await user.keyboard('{/Alt}{/Shift}');
      expect(onCommit).toHaveBeenLastCalledWith(altered + 10);
      // A plain press keeps `step`, onto its grid.
      await user.click(decrease);
      expect(onCommit).toHaveBeenLastCalledWith(radix === 10 ? 33 : 31);
      // The range bounds a modified step.
      await user.keyboard('{Shift>}');
      await user.click(increase);
      await user.keyboard('{/Shift}');
      expect(onCommit).toHaveBeenLastCalledWith(40);
    },
  );

  it('UIC-NUMBER-FIELD-3.2 steps the typed text with a modified step button, and refuses it while locked or without the step', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = render(
      <NumberField label="Weight" defaultValue={5} largeStep={10} onCommit={onCommit} />,
    );
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '20');
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('button', { name: /Increase/ }));
    await user.keyboard('{/Shift}');
    expect(input).toHaveValue('30');
    expect(onCommit).toHaveBeenLastCalledWith(30);
    // Without smallStep, Alt with a press does nothing, as Alt with an arrow does.
    await user.keyboard('{Alt>}');
    await user.click(screen.getByRole('button', { name: /Increase/ }));
    await user.keyboard('{/Alt}');
    expect(input).toHaveValue('30');
    rerender(
      <NumberField label="Weight" value={30} largeStep={10} isReadOnly onCommit={onCommit} />,
    );
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('button', { name: /Increase/ }));
    await user.keyboard('{/Shift}');
    expect(input).toHaveValue('30');
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('UIC-NUMBER-FIELD-2.2 keeps a large whole number on Enter and blur', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onChange = vi.fn();
    render(
      <NumberField
        label="Count"
        defaultValue={4503599627370496}
        step={1}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Enter}');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-NUMBER-FIELD-3.2 commits a tiny modified step without rounding it to zero', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <NumberField
        label="Fine increment"
        defaultValue={1e-7}
        smallStep={1e-7}
        step={1e-7}
        formatOptions={{ maximumFractionDigits: 10 }}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Fine increment' });
    await user.click(input);
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(input).toHaveValue('0.0000002');
    expect(onCommit).toHaveBeenLastCalledWith(2e-7);
  });

  it('UIC-NUMBER-FIELD-3.3 steps the value while its scrub handle is dragged', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField
        label="Weight"
        defaultValue={4}
        largeStep={10}
        showScrubber
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const scrubber = container.querySelector('.ui-number-field__scrubber') as HTMLElement;
    expect(scrubber).toHaveAttribute('aria-hidden', 'true');
    expect(scrubber.querySelector('[data-glyph="scrub"]')).not.toBeNull();
    const input = screen.getByRole('textbox');
    await user.pointer([
      { keys: '[MouseLeft>]', target: scrubber, coords: { clientX: 100 } },
      { coords: { clientX: 110 } },
    ]);
    expect(input).toHaveValue('6');
    await user.pointer({ coords: { clientX: 112 } });
    expect(input).toHaveValue('7');
    await user.keyboard('{Shift>}');
    await user.pointer({ coords: { clientX: 116 } });
    await user.keyboard('{/Shift}');
    expect(input).toHaveValue('17');
    await user.pointer({ coords: { clientX: 104 } });
    expect(input).toHaveValue('14');
    expect(onCommit).not.toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith(14);
    await user.pointer({ coords: { clientX: 200 } });
    expect(input).toHaveValue('14');
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { slots: ['scrubber'] });
  });

  it.each(['isDisabled', 'isReadOnly'] as const)(
    'UIC-NUMBER-FIELD-3.3 drops an active scrub when %s changes and requires a new press after unlocking',
    async (lock) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCommit = vi.fn();
      const props = { label: 'Weight', defaultValue: 4, showScrubber: true, onChange, onCommit };
      const { container, rerender } = render(<NumberField {...props} />);
      const scrubber = container.querySelector('.ui-number-field__scrubber') as HTMLElement;
      const input = screen.getByRole('textbox');
      await user.pointer([
        { keys: '[MouseLeft>]', target: scrubber, coords: { clientX: 100 } },
        { coords: { clientX: 108 } },
      ]);
      expect(input).toHaveValue('6');
      onChange.mockClear();
      rerender(<NumberField {...props} {...{ [lock]: true }} />);
      await user.pointer({ coords: { clientX: 120 } });
      expect(input).toHaveValue('6');
      rerender(<NumberField {...props} />);
      await user.pointer([{ coords: { clientX: 132 } }, { keys: '[/MouseLeft]' }]);
      expect(onChange).not.toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
      await user.pointer([
        { keys: '[MouseLeft>]', target: scrubber, coords: { clientX: 132 } },
        { coords: { clientX: 140 } },
        { keys: '[/MouseLeft]' },
      ]);
      expect(input).toHaveValue('8');
      expect(onCommit).toHaveBeenCalledExactlyOnceWith(8);
    },
  );

  it('UIC-NUMBER-FIELD-3.3 puts the start value back on a cancelled scrub and follows only its pointer', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <NumberField
        label="Weight"
        defaultValue={4}
        showScrubber
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const scrubber = container.querySelector('.ui-number-field__scrubber') as HTMLElement;
    const input = screen.getByRole('textbox');
    pointer('pointerDown', scrubber, 100);
    pointer('pointerMove', scrubber, 112);
    expect(input).toHaveValue('7');
    pointer('pointerMove', scrubber, 140, 9);
    pointer('pointerUp', scrubber, 140, 9);
    expect(input).toHaveValue('7');
    expect(onCommit).not.toHaveBeenCalled();
    pointer('pointerCancel', scrubber, 112);
    expect(input).toHaveValue('4');
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(onCommit).not.toHaveBeenCalled();
    pointer('pointerDown', scrubber, 100);
    pointer('pointerMove', scrubber, 104);
    pointer('pointerUp', scrubber, 104);
    expect(input).toHaveValue('5');
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('UIC-NUMBER-FIELD-3.3 abandons a scrub when the host replaces the value', () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const props = { label: 'Weight', showScrubber: true, onChange, onCommit };
    const { container, rerender } = render(<NumberField {...props} value={4} />);
    const scrubber = container.querySelector('.ui-number-field__scrubber') as HTMLElement;
    pointer('pointerDown', scrubber, 100);
    pointer('pointerMove', scrubber, 104);
    expect(onChange).toHaveBeenLastCalledWith(5);
    rerender(<NumberField {...props} value={5} />);
    pointer('pointerMove', scrubber, 108);
    expect(onChange).toHaveBeenLastCalledWith(6);
    rerender(<NumberField {...props} value={40} />);
    onChange.mockClear();
    pointer('pointerMove', scrubber, 140);
    pointer('pointerUp', scrubber, 140);
    expect(screen.getByRole('textbox')).toHaveValue('40');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-NUMBER-FIELD-3.3 scrubs toward the end of the line and not while locked', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <UiProvider locale="ar-EG">
        <NumberField
          label="Weight"
          defaultValue={4}
          showScrubber
          formatOptions={{ numberingSystem: 'latn' }}
        />
      </UiProvider>,
    );
    const scrubber = () => container.querySelector('.ui-number-field__scrubber') as HTMLElement;
    await user.pointer([
      { keys: '[MouseLeft>]', target: scrubber(), coords: { clientX: 100 } },
      { coords: { clientX: 92 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(screen.getByRole('textbox')).toHaveValue('6');
    rerender(<NumberField label="Weight" value={4} showScrubber isReadOnly />);
    await user.pointer([
      { keys: '[MouseLeft>]', target: scrubber(), coords: { clientX: 100 } },
      { coords: { clientX: 140 } },
    ]);
    expect(screen.getByRole('textbox')).toHaveValue('4');
  });
});
