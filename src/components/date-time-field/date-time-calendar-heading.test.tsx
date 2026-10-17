import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField } from './date-time-field.js';

describe('DateTimeField calendar heading', () => {
  it('UIC-DATE-TIME-FIELD-3.3 jumps by month and year from the heading selects', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Due"
          defaultValue="2026-04-13"
          calendarHeading="select"
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('.ui-date-time-field__calendar-heading')).toBeNull();
    const selects = dialog.querySelectorAll('.ui-date-time-field__calendar-select');
    expect([...selects].map((node) => node.getAttribute('data-unit'))).toEqual(['month', 'year']);
    const month = within(dialog).getByRole('button', { name: /Apr.*month/i });
    expect(month).toHaveClass('ui-date-time-field__calendar-select-button');
    await user.click(month);
    const months = screen.getByRole('listbox');
    expect(months).toHaveClass('ui-date-time-field__calendar-select-list');
    expect(within(months).getAllByRole('option')).toHaveLength(12);
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', {
      slots: [
        'calendar-select',
        'calendar-select-button',
        'calendar-select-popover',
        'calendar-select-list',
        'calendar-select-option',
      ],
    });
    await user.click(within(months).getByRole('option', { name: 'Sep' }));
    expect(within(dialog).getByRole('grid', { name: /September 2026/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /2026.*year/i }));
    await user.click(screen.getByRole('option', { name: '2030' }));
    expect(within(dialog).getByRole('grid', { name: /September 2030/ })).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
