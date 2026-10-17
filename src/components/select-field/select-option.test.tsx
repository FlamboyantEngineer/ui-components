import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SelectField, type SelectFieldItem } from './select-field.js';

const produce: SelectFieldItem[] = [
  { id: 'any', label: 'Anything' },
  {
    id: 'fruit',
    label: 'Fruit',
    options: [
      { id: 'apple', label: 'Apple', icon: 'plus' },
      { id: 'pear', label: 'Pear' },
    ],
  },
  {
    id: 'vegetables',
    label: 'Vegetables',
    options: [
      { id: 'kale', label: 'Kale', description: 'Leafy' },
      { id: 'leek', label: 'Leek' },
    ],
  },
  { id: 'other', options: [{ id: 'salt', label: 'Salt' }] },
];

function trigger(name: RegExp | string = /Produce$/) {
  return screen.getByRole('button', { name });
}

describe('SelectField option groups and content', () => {
  it('UIC-SELECT-FIELD-7.1 draws groups as headed sections in option order', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <SelectField
        label="Produce"
        selectionMode="multiple"
        options={produce}
        defaultValue={['salt', 'kale']}
        onCommit={onCommit}
      />,
    );
    await user.click(trigger());
    const listbox = screen.getByRole('listbox');
    const groups = within(listbox).getAllByRole('group');
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveClass('ui-select-field__section');
    expect(groups[0]).toHaveAccessibleName('Fruit');
    expect(within(groups[0] as HTMLElement).getByText('Fruit')).toHaveClass(
      'ui-select-field__section-header',
    );
    expect(within(groups[1] as HTMLElement).getAllByRole('option')).toHaveLength(2);
    expect(groups[2]?.querySelector('.ui-select-field__section-header')).toBeNull();
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
      slots: ['section', 'section-header', 'option'],
    });
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onCommit).toHaveBeenLastCalledWith(['apple', 'kale', 'salt']);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Kale Leafy' })).toHaveFocus();
  });

  it('UIC-SELECT-FIELD-7.1 filters grouped options and hides empty sections', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectField label="Produce" options={produce} filterable defaultValue="leek" />,
    );
    expect(container.querySelector('.ui-select-field')).toHaveAttribute('data-icons', 'true');
    await user.click(trigger('Leek Produce'));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lea' } });
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Kale Leafy',
    ]);
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });

  it('UIC-SELECT-FIELD-7.2 draws options through renderOption and keeps the trigger text', async () => {
    const user = userEvent.setup();
    const renderOption = vi.fn((option, state: { isSelected: boolean }) => (
      <span data-testid={`custom-${String(option.id)}`}>
        {option.label} {state.isSelected ? '(chosen)' : ''}
      </span>
    ));
    render(
      <SelectField
        label="Produce"
        options={produce}
        defaultValue="pear"
        renderOption={renderOption}
      />,
    );
    expect(trigger('Pear Produce')).toBeInTheDocument();
    await user.click(trigger('Pear Produce'));
    expect(screen.getByTestId('custom-pear')).toHaveTextContent('Pear (chosen)');
    expect(screen.getByTestId('custom-apple')).toHaveTextContent('Apple');
    const apple = screen.getByRole('option', { name: /Apple/ });
    expect(apple).toHaveClass('ui-select-field__option');
    expect(apple.querySelector('.ui-select-field__option-label')).toBeNull();
    expect(renderOption).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pear' }),
      expect.objectContaining({ isSelected: true, isDisabled: false }),
    );
    await user.keyboard('k');
    expect(screen.getByRole('option', { name: /Kale/ })).toHaveFocus();
  });
});
