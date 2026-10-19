import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { RelativeDateField } from './relative-date-field.js';

const getNow = () => new Date(2026, 4, 23, 10, 30, 0);

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

describe('RelativeDateField calendar', () => {
  it('UIC-RELATIVE-DATE-FIELD-2.1 picks any day from a calendar beside the presets', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        defaultValue="2026-05-24"
        getNow={getNow}
        showCalendar
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tomorrow Due' }));
    const listbox = screen.getByRole('listbox');
    const popover = listbox.closest('.ui-relative-date-field__popover') as HTMLElement;
    const calendar = popover.querySelector('.ui-relative-date-field__calendar') as HTMLElement;
    expect(calendar).not.toBeNull();
    expect(within(calendar).getByRole('grid', { name: /May 2026/ })).toHaveClass(
      'ui-date-time-field__calendar-grid',
    );
    expect(
      within(calendar)
        .getByRole('button', { name: /May 24, 2026/ })
        .closest('[role="gridcell"]'),
    ).toHaveAttribute('aria-selected', 'true');
    expectHooksMatchSpec(document.body, 'RELATIVE-DATE-FIELD', {
      slots: ['popover', 'listbox', 'option', 'calendar'],
    });
    await user.click(within(calendar).getByRole('button', { name: /May 28, 2026/ }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-28');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In 5 days Due' })).toBeInTheDocument();
  });

  it('UIC-RELATIVE-DATE-FIELD-2.1 keeps the time for date-times and picks ranges', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = renderInLocale(
      <RelativeDateField
        label="Due"
        valueKind="date-time"
        getNow={getNow}
        showCalendar
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    await user.click(screen.getByRole('button', { name: /May 30, 2026/ }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-30T10:30');
    unmount();
    renderInLocale(
      <RelativeDateField
        label="Period"
        valueKind="date-range"
        getNow={getNow}
        showCalendar
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Period$/ }));
    await user.click(screen.getByRole('button', { name: /May 4, 2026/ }));
    await user.click(screen.getByRole('button', { name: /May 8, 2026/ }));
    expect(onCommit).toHaveBeenLastCalledWith({ start: '2026-05-04', end: '2026-05-08' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
