import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PeoplePicker } from './people-picker.js';

describe('PeoplePicker locking', () => {
  it('UIC-PEOPLE-PICKER-1.1 closes an open people list for good when it turns disabled', async () => {
    const user = userEvent.setup();
    const people = async () => [{ id: 'ada', name: 'Ada Moreno' }];
    const picker = (isDisabled: boolean) => (
      <PeoplePicker label="Owner" loadItems={people} searchDelay={0} isDisabled={isDisabled} />
    );
    const { rerender } = render(picker(false));
    await user.type(screen.getByRole('combobox'), 'ad');
    await screen.findByRole('option', { name: /Ada Moreno/ });
    rerender(picker(true));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(picker(false));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
