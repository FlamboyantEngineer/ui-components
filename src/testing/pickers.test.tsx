import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from '../components/combobox/combobox.js';
import { DateTimeField } from '../components/date-time-field/date-time-field.js';
import { SelectField } from '../components/select-field/select-field.js';
import { UiProvider } from '../core/provider.js';
import { getHookElement, pickComboboxOption, pickDate, selectOption } from './index.js';

const fruit = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
  { id: 'plum', label: 'Plum' },
];

describe('testing pickers', () => {
  it('UIC-TESTING-2.1 picks a select field option from the field or its button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<SelectField label="Fruit" options={fruit} onChange={onChange} />);
    await selectOption(user, getHookElement(container, 'select-field'), 'Pear');
    expect(onChange).toHaveBeenLastCalledWith('pear');
    await selectOption(user, screen.getByRole('button', { name: 'Pear Fruit' }), /^Plum/);
    expect(onChange).toHaveBeenLastCalledWith('plum');
  });

  it('UIC-TESTING-2.1 picks several options of a multiple selection from the open list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SelectField label="Fruit" selectionMode="multiple" options={fruit} onChange={onChange} />,
    );
    const field = getHookElement(container, 'select-field');
    await selectOption(user, field, 'Pear');
    await selectOption(user, field, 'Plum');
    expect(onChange).toHaveBeenLastCalledWith(['pear', 'plum']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('UIC-TESTING-2.1 picks a combobox option from its button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Combobox label="Fruit" defaultItems={fruit} onChange={onChange} />,
    );
    await selectOption(user, getHookElement(container, 'combobox'), 'Plum');
    expect(onChange).toHaveBeenLastCalledWith('plum', { reason: 'select' });
    expect(screen.getByRole('combobox', { name: 'Fruit' })).toHaveValue('Plum');
  });

  it('UIC-TESTING-2.2 types into a combobox and presses the suggestion', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Combobox label="Fruit" defaultItems={fruit} defaultValue="apple" onChange={onChange} />,
    );
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    await pickComboboxOption(user, input, { text: 'Pl', option: 'Plum' });
    expect(onChange).toHaveBeenLastCalledWith('plum', { reason: 'select' });
    await pickComboboxOption(user, input, { text: 'Pear' });
    expect(onChange).toHaveBeenLastCalledWith('pear', { reason: 'select' });
    expect(input).toHaveValue('Pear');
  });

  it('UIC-TESTING-2.4 types an ISO date into the segments in locale order', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = render(
      <UiProvider locale="en-GB">
        <DateTimeField label="Due" onCommit={onCommit} />
      </UiProvider>,
    );
    await pickDate(user, getHookElement(container, 'date-time-field'), '2026-05-14');
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-14');
    rerender(
      <UiProvider locale="en-US">
        <DateTimeField label="Due" onCommit={onCommit} />
      </UiProvider>,
    );
    await pickDate(user, getHookElement(container, 'date-time-field'), '2027-11-03');
    expect(onCommit).toHaveBeenLastCalledWith('2027-11-03');
    await expect(pickDate(user, container, '14/05/2026')).rejects.toThrow(
      '14/05/2026 is not an ISO 8601 date (YYYY-MM-DD).',
    );
  });
});
