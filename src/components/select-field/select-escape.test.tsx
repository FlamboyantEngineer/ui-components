import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../modal/modal.js';
import { SelectField } from './select-field.js';

const options = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];

describe('SelectField filtered cancellation', () => {
  it('UIC-SELECT-FIELD-3.1 UIC-SELECT-FIELD-3.5 closes the filter with one Escape and leaves its modal and value intact', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Modal isOpen title="Fruit settings">
        <SelectField
          label="Fruit"
          options={options}
          defaultValue="pear"
          filterable
          onChange={onChange}
        />
      </Modal>,
    );
    const trigger = screen.getByRole('button', { name: 'Pear Fruit' });
    await user.click(trigger);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'app');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAccessibleName('Pear Fruit');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Fruit settings' })).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('UIC-SELECT-FIELD-3.1 leaves a composing Escape to its input method', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Fruit" options={options} defaultValue="pear" filterable />);
    await user.click(screen.getByRole('button', { name: 'Pear Fruit' }));
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'app');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot send an input method's isComposing key.
    fireEvent.keyDown(search, { key: 'Escape', isComposing: true });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(search).toHaveValue('app');
  });
});
