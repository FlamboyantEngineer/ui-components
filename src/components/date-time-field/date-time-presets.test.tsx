import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField } from './date-time-field.js';

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

// Day 0 is Sunday and day 6 Saturday; noon UTC keeps the date in every zone.
const isWeekend = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0;

describe('DateTimeField availability and presets', () => {
  it('UIC-DATE-TIME-FIELD-3.1 refuses unavailable days in the calendar and when typed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <DateTimeField
        label="Visit"
        defaultValue="2026-04-16"
        isDateUnavailable={isWeekend}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const saturday = screen.getByRole('button', { name: /Saturday, April 18, 2026/ });
    expect(saturday.closest('[role="gridcell"]')?.firstElementChild).toHaveAttribute(
      'data-unavailable',
      'true',
    );
    await user.click(saturday);
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    act(() => screen.getByRole('spinbutton', { name: /^day/ }).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-17');
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.ui-date-time-field')).toHaveAttribute(
      'data-validation',
      'invalid',
    );
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Choose an available date.',
    );
  });

  it('UIC-DATE-TIME-FIELD-3.2 offers presets that commit and close, disabling refused ones', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Window"
        mode="date-range"
        minValue="2026-01-01"
        presets={[
          { label: 'First week', value: { start: '2026-01-01', end: '2026-01-07' } },
          { label: 'Last year', value: { start: '2025-01-01', end: '2025-12-31' } },
        ]}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = screen.getByRole('dialog');
    const presets = dialog.querySelector('.ui-date-time-field__presets') as HTMLElement;
    expect(presets.nextElementSibling).toHaveClass('ui-date-time-field__calendar');
    const first = within(presets).getByRole('button', { name: 'First week' });
    expect(first).toHaveClass('ui-button', 'ui-date-time-field__preset');
    expect(within(presets).getByRole('button', { name: 'Last year' })).toBeDisabled();
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', { slots: ['presets', 'preset'] });
    await user.click(first);
    expect(onCommit).toHaveBeenCalledWith({ start: '2026-01-01', end: '2026-01-07' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-3.2 disables a preset on an unavailable date and has none for times', async () => {
    const user = userEvent.setup();
    const { unmount } = renderInLocale(
      <DateTimeField
        label="Visit"
        isDateUnavailable={isWeekend}
        presets={[
          { label: 'Friday', value: '2026-04-17' },
          { label: 'Saturday', value: '2026-04-18' },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getByRole('button', { name: 'Friday' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Saturday' })).toBeDisabled();
    await user.keyboard('{Escape}');
    unmount();
    const { container } = renderInLocale(
      <DateTimeField label="At" mode="time" presets={[{ label: 'Noon', value: '12:00' }]} />,
    );
    expect(container.querySelector('.ui-date-time-field__presets')).toBeNull();
  });
});
