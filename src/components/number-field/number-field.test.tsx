import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { NumberField, type NumberFieldProps } from './number-field.js';

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-field');
}

function message(container: HTMLElement) {
  return container.querySelector('.ui-field__message')?.textContent;
}

function SavedField(props: Omit<NumberFieldProps, 'label'>) {
  const [saved, setSaved] = useState<number | null>(4);
  return <NumberField label="Weight" committedValue={saved} onCommit={setSaved} {...props} />;
}

describe('NumberField', () => {
  it('UIC-NUMBER-FIELD-1.1 is a field around a React Aria number field that starts empty', async () => {
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
    expectHooksMatchSpec(container, 'NUMBER-FIELD', { slots: 'all' });
    expectHooksMatchSpec(container, 'FIELD', { slots: ['label', 'control'] });
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

    const hidden = render(<NumberField label="Weight" defaultValue={2} step={2} hideStepper />);
    expect(screen.queryByRole('button', { name: 'Increase Weight' })).toBeNull();
    expect(root(hidden.container)).toHaveAttribute('data-hide-stepper', 'true');
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('textbox')).toHaveValue('4');
    expectHooksMatchSpec(hidden.container, 'NUMBER-FIELD', { slots: ['box', 'group', 'input'] });
  });

  it('UIC-NUMBER-FIELD-1.4 names, describes and locks the input', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <NumberField id="weight" label="Weight" description="In kilograms." isRequired />,
    );
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toHaveAttribute('aria-required', 'true');
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

  it('UIC-NUMBER-FIELD-2.2 clamps and snaps by default', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <NumberField label="Weight" minValue={0} maxValue={10} step={0.5} onCommit={onCommit} />,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '12');
    await user.tab();
    expect(onCommit).toHaveBeenLastCalledWith(10);
    await user.clear(input);
    await user.type(input, '3.3');
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
});
