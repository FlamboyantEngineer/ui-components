import { PlusGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp', icon: PlusGlyph },
  { id: 'pear', label: 'Pear' },
  { id: 'plum', label: 'Plum', isDisabled: true },
  { id: 'fig', label: 'Fig' },
];

function trigger(name: RegExp | string = /Fruit$/) {
  return screen.getByRole('button', { name });
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-select-field');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SelectField field', () => {
  it('UIC-SELECT-FIELD-1.2 keeps numeric and text selections distinct while submitting their original values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = [
      { id: 1, label: 'Numeric' },
      { id: '1', label: 'Textual' },
    ];
    const { container } = render(
      <form>
        <SelectField
          label="Types"
          options={options}
          selectionMode="multiple"
          defaultValue={[1]}
          onChange={onChange}
          name="types"
        />
      </form>,
    );
    await user.click(screen.getByRole('button', { name: '1 selected Types' }));
    await user.click(screen.getByRole('option', { name: 'Textual' }));
    expect(onChange).toHaveBeenLastCalledWith([1, '1']);
    expect(new FormData(requireDefined(container.querySelector('form'))).getAll('types')).toEqual([
      '1',
      '1',
    ]);
  });

  it.each(['isReadOnly', 'isDisabled'] as const)(
    'UIC-SELECT-FIELD-1.3 keeps an explicitly open list closed while %s',
    (lock) => {
      render(<SelectField label="Types" options={fruit} isOpen {...{ [lock]: true }} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    },
  );

  it('UIC-SELECT-FIELD-1.1 renders a field around a framed trigger named by its value and label', () => {
    const { container } = render(
      <SelectField
        id="fruit"
        label="Fruit"
        options={fruit}
        defaultValue="apple"
        description="Pick one."
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'ui-select-field');
    expect(field).toHaveAttribute('data-selection-mode', 'single');
    const button = trigger('Apple Fruit');
    expect(button).toHaveClass('ui-select-field__trigger');
    expect(button).toHaveAttribute('id', 'fruit-control');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAccessibleDescription('Pick one.');
    expect(button.parentElement).toHaveClass('ui-select-field__frame');
    expect(button.closest('.ui-select-field__select')).not.toBeNull();
    expect(container.querySelector('label')).toHaveAttribute('for', 'fruit-control');
    expectHooksMatchSpec(container, 'SELECT-FIELD', {
      slots: ['select', 'frame', 'trigger', 'value', 'value-icon', 'value-label', 'chevron'],
    });
  });

  it('UIC-SELECT-FIELD-1.2 relays a controlled value and commits every pick', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<Key | null>('apple');
      return (
        <>
          <SelectField
            label="Fruit"
            options={fruit}
            value={value}
            onChange={setValue}
            onCommit={onCommit}
          />
          <output aria-label="Current value">{String(value)}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(trigger('Apple Fruit'));
    await user.click(screen.getByRole('option', { name: 'Fig' }));
    expect(screen.getByRole('status', { name: 'Current value' })).toHaveTextContent('fig');
    expect(onCommit).toHaveBeenCalledWith('fig');
    expect(trigger('Fig Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-1.2 holds a multiple value in option order and commits each toggle', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['fig']}
        onCommit={onCommit}
      />,
    );
    await user.click(trigger(/Fruit$/));
    await user.click(screen.getByRole('option', { name: 'Apple Crisp' }));
    expect(onCommit).toHaveBeenLastCalledWith(['apple', 'fig']);
    await user.click(screen.getByRole('option', { name: 'Fig' }));
    expect(onCommit).toHaveBeenLastCalledWith(['apple']);
  });

  it('UIC-SELECT-FIELD-1.3 validates the value and marks the select invalid', () => {
    const { container } = render(<SelectField label="Fruit" options={fruit} isRequired />);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(container.querySelector('.ui-select-field__select')).toHaveAttribute(
      'data-invalid',
      'true',
    );
    expect(trigger(/Fruit$/)).toHaveAccessibleDescription('A value is required.');
  });

  it('UIC-SELECT-FIELD-1.3 reports warnings and pending checks from the field base', () => {
    const { container, rerender } = render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="fig"
        validate={(value) =>
          value === 'fig' ? { severity: 'warning', message: 'Figs are seasonal.' } : null
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(screen.getByText('Figs are seasonal.')).toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} defaultValue="fig" isPending />);
    expect(root(container)).toHaveAttribute('data-validation', 'pending');
  });

  it('UIC-SELECT-FIELD-1.3 keeps a read-only trigger focusable but closed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectField label="Fruit" options={fruit} defaultValue="apple" isReadOnly />,
    );
    expect(root(container)).toHaveAttribute('data-readonly', 'true');
    const button = trigger('Apple Fruit');
    expect(button).toBeEnabled();
    await user.click(button);
    expect(button).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-1.3 disables the trigger of a disabled select', () => {
    const { container } = render(
      <SelectField label="Fruit" options={fruit} defaultValue="apple" isDisabled />,
    );
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(trigger('Apple Fruit')).toBeDisabled();
  });

  it('UIC-SELECT-FIELD-1.4 restores the committed value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectField label="Fruit" options={fruit} committedValue="apple" />,
    );
    await user.click(trigger('Apple Fruit'));
    await user.click(screen.getByRole('option', { name: 'Fig' }));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Fruit' }));
    expect(trigger('Apple Fruit')).toHaveFocus();
    expect(root(container)).not.toHaveAttribute('data-dirty');
  });

  it('UIC-SELECT-FIELD-1.4 undoes and redoes picks from the keyboard', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Fruit" options={fruit} defaultValue="apple" />);
    await user.click(trigger('Apple Fruit'));
    await user.click(screen.getByRole('option', { name: 'Pear' }));
    await waitFor(() => expect(trigger('Pear Fruit')).toHaveFocus());
    await user.keyboard('{Control>}z{/Control}');
    expect(trigger('Apple Fruit')).toBeInTheDocument();
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');
    expect(trigger('Pear Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-1.4 clears and sets the default from the field menu', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        menu={['clear', 'set-default']}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(trigger('Select an option Fruit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Set to default' }));
    expect(trigger('Pear Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-1.4 clears a multiple select to an empty list', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['apple']}
        menu={['clear']}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(onCommit).toHaveBeenCalledWith([]);
  });

  it('UIC-SELECT-FIELD-1.5 forwards the caller class, id, data attributes and open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <SelectField
        label="Fruit"
        options={fruit}
        className="caller"
        id="fruit"
        data-testid="probe"
        defaultOpen
        onOpenChange={onOpenChange}
        autoFocus
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'ui-select-field', 'caller');
    expect(field).toHaveAttribute('id', 'fruit');
    expect(field).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expectHooksMatchSpec(container, 'SELECT-FIELD', { callerAttributes: ['data-testid'] });
  });
});

describe('SelectField trigger', () => {
  it('UIC-SELECT-FIELD-2.1 shows the placeholder, a missing choice and a multiple select count', () => {
    const { container, rerender } = render(<SelectField label="Fruit" options={fruit} />);
    const value = () => container.querySelector('.ui-select-field__value');
    expect(value()).toHaveAttribute('data-placeholder', 'true');
    expect(value()).toHaveTextContent('Select an option');
    rerender(<SelectField label="Fruit" options={fruit} placeholder="Choose a fruit" />);
    expect(value()).toHaveTextContent('Choose a fruit');
    rerender(<SelectField label="Fruit" options={fruit} value="kiwi" />);
    expect(value()).toHaveAttribute('data-missing', 'true');
    expect(value()).toHaveTextContent('kiwi');
    rerender(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        value={['apple', 'fig']}
        placeholder="Add"
      />,
    );
    expect(value()).toHaveTextContent('2 selected');
    expect(value()).not.toHaveAttribute('data-placeholder');
    expect(trigger('2 selected Fruit')).toBeInTheDocument();
    rerender(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        value={[]}
        placeholder="Add"
      />,
    );
    expect(value()).toHaveTextContent('Add');
    expect(value()).toHaveAttribute('data-placeholder', 'true');
    expect(container.querySelector('.ui-select-field__chevron')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );
    expectHooksMatchSpec(container, 'SELECT-FIELD');
  });

  it('UIC-SELECT-FIELD-2.1 lists an empty option that stands for no value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        emptyLabel="None"
        onCommit={onCommit}
      />,
    );
    await user.click(trigger('Pear Fruit'));
    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options[0]).toBe('None');
    await user.click(screen.getByRole('option', { name: 'None' }));
    expect(onCommit).toHaveBeenCalledWith(null);
    expect(trigger('None Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-1.2 shows a chosen option whose id is empty text, which reads as no value otherwise', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = [
      { id: '', label: 'None' },
      { id: 'apple', label: 'Apple' },
    ];
    const { unmount } = render(
      <SelectField label="Fruit" options={options} defaultValue="apple" onChange={onChange} />,
    );
    await user.click(trigger('Apple Fruit'));
    await user.click(screen.getByRole('option', { name: 'None' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(trigger('None Fruit')).toBeInTheDocument();
    unmount();
    render(<SelectField label="Fruit" options={fruit} value="" />);
    expect(trigger('Select an option Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-2.2 publishes the widest label width measured in the trigger font', async () => {
    const measureText = vi.fn((text: string) => ({ width: text.length * 7 }));
    const canvas = vi.fn(function () {
      return { getContext: () => ({ measureText, font: '' }) };
    });
    vi.stubGlobal('OffscreenCanvas', canvas);
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SelectField label="Fruit" options={fruit} placeholder="Pick" />,
    );
    const select = () => container.querySelector<HTMLElement>('.ui-select-field__select');
    await waitFor(() =>
      expect(select()?.style.getPropertyValue('--ui-select-field-label-width')).toBe('35px'),
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute('data-icons', 'true');
    const calls = measureText.mock.calls.length;
    await user.click(trigger(/Fruit$/));
    await user.keyboard('{Escape}');
    rerender(<SelectField label="Fruit" options={fruit} placeholder="Pick" defaultValue="fig" />);
    expect(measureText).toHaveBeenCalledTimes(calls);
    rerender(
      <SelectField
        label="Fruit"
        options={[...fruit, { id: 'melon', label: 'Honeydew melon' }]}
        placeholder="Pick"
      />,
    );
    await waitFor(() =>
      expect(select()?.style.getPropertyValue('--ui-select-field-label-width')).toBe('98px'),
    );
    expectHooksMatchSpec(container, 'SELECT-FIELD');
  });

  it('UIC-SELECT-FIELD-2.3 shows the replaced committed option before the current value', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectField label="Fruit" options={fruit} committedValue="apple" />,
    );
    expect(container.querySelector('.ui-select-field__previous')).toBeNull();
    await user.click(trigger('Apple Fruit'));
    await user.click(screen.getByRole('option', { name: 'Fig' }));
    const previous = container.querySelector('.ui-select-field__previous');
    expect(previous).toHaveClass('ui-field-previous-value');
    expect(previous?.querySelector('del')).toHaveTextContent('Apple');
    expect(previous?.querySelector('.ui-select-field__value-icon')).not.toBeNull();
    expect(previous?.nextElementSibling).toHaveClass('ui-select-field__trigger');
    expect(previous?.closest('button')).toBeNull();
    expect(trigger('Fig Fruit')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['previous'] });
  });
});

describe('SelectField forms', () => {
  it('UIC-SELECT-FIELD-6.1 publishes the chosen ids to the form', () => {
    const { container } = render(
      <form>
        <SelectField label="Fruit" name="fruit" options={fruit} defaultValue="pear" />
        <SelectField
          label="Basket"
          name="basket"
          selectionMode="multiple"
          options={fruit}
          defaultValue={['apple', 'fig']}
        />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    const data = new FormData(form);
    expect(data.getAll('fruit')).toEqual(['pear']);
    expect(data.getAll('basket')).toEqual(['apple', 'fig']);
  });

  it('UIC-SELECT-FIELD-6.1 publishes an empty entry while the empty option stands for no value', () => {
    const { container, rerender } = render(
      <form>
        <SelectField label="Fruit" name="fruit" options={fruit} emptyLabel="None" value={null} />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).getAll('fruit')).toEqual(['']);
    rerender(
      <form>
        <SelectField label="Fruit" name="fruit" options={fruit} emptyLabel="None" value="fig" />
      </form>,
    );
    expect(new FormData(form).getAll('fruit')).toEqual(['fig']);
  });
});
