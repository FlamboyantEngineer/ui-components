import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchField } from './search-field.js';

describe('SearchField key handlers', () => {
  it('UIC-SEARCH-FIELD-1.1 lets a key the handler does not stop go on to the elements around it', async () => {
    const user = userEvent.setup();
    const around = vi.fn();
    render(
      <div onKeyDown={(event) => around(event.key)}>
        <SearchField label="Filter" onKeyDown={() => undefined} />
      </div>,
    );
    await user.click(screen.getByRole('searchbox', { name: 'Filter' }));
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(around).toHaveBeenCalledWith('Enter');
  });
});
