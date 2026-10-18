import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'fig', label: 'Fig' },
];

describe('SelectField clear button', () => {
  it('UIC-SELECT-FIELD-8.1 clears a single value in one press and focuses the trigger', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <SelectField
        label="Fruit"
        options={fruit}
        defaultValue="pear"
        isClearable
        onCommit={onCommit}
      />,
    );
    const clear = screen.getByRole('button', { name: 'Clear Fruit' });
    expect(clear).toHaveClass('ui-select-field__clear', 'ui-icon-button');
    expect(clear.closest('.ui-select-field__frame')).not.toBeNull();
    expect(clear.closest('.ui-select-field__trigger')).toBeNull();
    expectHooksMatchSpec(container, 'SELECT-FIELD', { slots: ['clear'] });
    await user.click(clear);
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select an option Fruit' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-8.1 clears a multiple value from the keyboard', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider strings={{ clearValue: (label) => `Vider ${label}` }}>
        <SelectField
          label="Basket"
          selectionMode="multiple"
          options={fruit}
          defaultValue={['apple', 'fig']}
          isClearable
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    screen.getByRole('button', { name: 'Vider Basket' }).focus();
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-8.1 offers no clear button when the field cannot be cleared', () => {
    const { rerender } = render(<SelectField label="Fruit" options={fruit} isClearable />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" isClearable isRequired />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" isClearable isReadOnly />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} value="pear" />);
    expect(screen.queryByRole('button', { name: 'Clear Fruit' })).not.toBeInTheDocument();
  });
});
