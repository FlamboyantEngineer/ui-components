import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { Fieldset } from '../field/field.js';
import { SelectField, type SelectFieldItem, type SelectFieldOption } from './select-field.js';

const rates: SelectFieldOption[] = [
  { id: 'slow', label: 'Slow' },
  { id: 'medium', label: 'Medium' },
  { id: 'fast', label: 'Fast', isDisabled: true },
];

function optionTexts(select: HTMLElement): string[] {
  return [...(select as HTMLSelectElement).options].map((option) => option.text);
}

describe('SelectField native presentation', () => {
  it('UIC-SELECT-FIELD-14.1 renders a labelled native select with its hooks and ref', () => {
    const selectRef = createRef<HTMLSelectElement>();
    const { container } = render(
      <SelectField
        mode="native"
        label="Rate"
        options={rates}
        defaultValue="medium"
        description="How often to sample"
        selectRef={selectRef}
        autoComplete="off"
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Rate' });
    expect(select.tagName).toBe('SELECT');
    expect(selectRef.current).toBe(select);
    expect(select).toHaveClass('ui-select-field__native');
    expect(select).toHaveAccessibleDescription('How often to sample');
    expect(select).toHaveAttribute('autocomplete', 'off');
    expect(select).toHaveValue('medium');
    expect(optionTexts(select)).toEqual(['Slow', 'Medium', 'Fast']);
    expect(screen.getByRole('option', { name: 'Fast' })).toBeDisabled();
    const root = container.querySelector('.ui-select-field');
    expect(root).toHaveAttribute('data-mode', 'native');
    expect(root).toHaveAttribute('data-selection-mode', 'single');
    const icon = select.nextElementSibling;
    expect(icon).toHaveClass('ui-select-field__native-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-slot', 'native-select-icon');
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['frame', 'native', 'native-icon'] });
  });

  it('UIC-SELECT-FIELD-14.1 draws labelled groups as optgroups and unlabelled groups in place', () => {
    const items: SelectFieldItem[] = [
      { id: 'auto', label: 'Automatic' },
      { id: 'timed', label: 'Timed', options: [{ id: 'one', label: 'One second' }] },
      { id: 'more', options: [{ id: 'manual', label: 'Manual' }] },
    ];
    render(<SelectField mode="native" label="Trigger" options={items} defaultValue="auto" />);
    const select = screen.getByRole('combobox', { name: 'Trigger' });
    expect(optionTexts(select)).toEqual(['Automatic', 'One second', 'Manual']);
    const groups = select.querySelectorAll('optgroup');
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAttribute('label', 'Timed');
  });

  it('UIC-SELECT-FIELD-14.2 commits the picked id as given and submits its text', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const keyed: SelectFieldOption[] = [
      { id: 1, label: 'Numeric one' },
      { id: 'two', label: 'Two' },
    ];
    const { container } = render(
      <form>
        <SelectField
          mode="native"
          label="Channel"
          options={keyed}
          name="channel"
          onCommit={onCommit}
        />
      </form>,
    );
    const select = screen.getByRole('combobox', { name: 'Channel' });
    await user.selectOptions(select, 'Numeric one');
    expect(onCommit).toHaveBeenLastCalledWith(1);
    const form = container.querySelector('form') ?? undefined;
    expect(new FormData(form).getAll('channel')).toEqual(['1']);
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
    await user.selectOptions(select, 'Two');
    expect(onCommit).toHaveBeenLastCalledWith('two');
  });

  it('UIC-SELECT-FIELD-14.3 offers an empty label that commits null', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        mode="native"
        label="Rate"
        options={rates}
        emptyLabel="None"
        defaultValue="slow"
        onCommit={onCommit}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Rate' });
    expect(optionTexts(select)).toEqual(['None', 'Slow', 'Medium', 'Fast']);
    expect(screen.getByRole('option', { name: 'None' })).toBeEnabled();
    await user.selectOptions(select, 'None');
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(select).toHaveValue('');
  });

  it('UIC-SELECT-FIELD-14.3 keeps the choice while options change and shows a placeholder without it', () => {
    function Changing({ options }: { options: SelectFieldOption[] }) {
      const [value, setValue] = useState<Key | null>('medium');
      return (
        <SelectField
          mode="native"
          label="Rate"
          options={options}
          value={value}
          onChange={setValue}
          isRequired
          placeholder="No rate available"
        />
      );
    }
    const { rerender, container } = render(<Changing options={rates} />);
    const select = screen.getByRole('combobox', { name: 'Rate' });
    expect(select).toHaveValue('medium');
    expect(optionTexts(select)).toEqual(['Slow', 'Medium', 'Fast']);
    rerender(<Changing options={[{ id: 'medium', label: 'Medium' }, ...rates]} />);
    expect(select).toHaveValue('medium');
    rerender(<Changing options={[]} />);
    expect(optionTexts(select)).toEqual(['No rate available']);
    expect(screen.getByRole('option', { name: 'No rate available' })).toBeDisabled();
    expect(select).toHaveAttribute('data-placeholder', 'true');
    expect(select).toHaveAttribute('data-missing', 'true');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(/./);
    rerender(<Changing options={rates} />);
    expect(select).toHaveValue('medium');
    expect(select).not.toHaveAttribute('data-placeholder');
    expect(select).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-SELECT-FIELD-14.4 asks the browser for a choice only in the native behavior', () => {
    const { rerender } = render(
      <SelectField mode="native" label="Rate" options={rates} isRequired />,
    );
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: /Rate/ });
    expect(select).toBeRequired();
    expect(select.matches(':required')).toBe(false);
    expect(select).toHaveAttribute('aria-errormessage');
    rerender(
      <SelectField
        mode="native"
        label="Rate"
        options={rates}
        isRequired
        validationBehavior="native"
      />,
    );
    expect(select.matches(':required')).toBe(true);
    expect(select.checkValidity()).toBe(false);
  });

  it('UIC-SELECT-FIELD-14.4 disables the select with the field or an enclosing fieldset', () => {
    const { container, rerender } = render(
      <form>
        <fieldset disabled>
          <SelectField mode="native" label="Rate" options={rates} defaultValue="slow" name="rate" />
        </fieldset>
      </form>,
    );
    const select = screen.getByRole('combobox', { name: 'Rate' });
    expect(select).toBeDisabled();
    expect(select).toHaveValue('slow');
    expect(new FormData(container.querySelector('form') ?? undefined).has('rate')).toBe(false);
    rerender(
      <form>
        <Fieldset legend="Sampling" isDisabled>
          <SelectField mode="native" label="Rate" options={rates} defaultValue="slow" name="rate" />
        </Fieldset>
      </form>,
    );
    expect(screen.getByRole('combobox', { name: 'Rate' })).toBeDisabled();
    rerender(
      <SelectField mode="native" label="Rate" options={rates} defaultValue="slow" isDisabled />,
    );
    expect(screen.getByRole('combobox', { name: 'Rate' })).toBeDisabled();
  });

  it('UIC-SELECT-FIELD-14.4 keeps a read-only select focusable and refuses changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const prevented: string[] = [];
    const record = (event: Event) => {
      if (event.defaultPrevented)
        prevented.push(event instanceof KeyboardEvent ? event.key : event.type);
    };
    document.addEventListener('keydown', record);
    document.addEventListener('mousedown', record);
    render(
      <SelectField
        mode="native"
        label="Rate"
        options={rates}
        defaultValue="slow"
        isReadOnly
        onChange={onChange}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Rate' });
    expect(select).toBeEnabled();
    expect(select).toHaveAttribute('aria-readonly', 'true');
    await user.click(select);
    expect(select).toHaveFocus();
    await user.keyboard('{ArrowDown}m{Control>}z{/Control}{Tab}');
    expect(prevented).toEqual(['mousedown', 'ArrowDown', 'm']);
    await user.selectOptions(select, 'Medium');
    expect(onChange).not.toHaveBeenCalled();
    expect(select).toHaveValue('slow');
    document.removeEventListener('keydown', record);
    document.removeEventListener('mousedown', record);
  });

  it('UIC-SELECT-FIELD-14.5 shows the committed option before the select while dirty', () => {
    render(
      <SelectField
        mode="native"
        label="Rate"
        options={rates}
        value="medium"
        committedValue="slow"
      />,
    );
    const previous = screen.getByText('Slow', {
      selector: '.ui-select-field__previous *, .ui-select-field__previous',
    });
    expect(previous.closest('.ui-select-field__frame')).not.toBeNull();
  });
});
