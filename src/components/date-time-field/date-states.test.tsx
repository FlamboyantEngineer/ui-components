import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField, type DateTimeFieldDateState } from './date-time-field.js';

const getDateState = (date: string): DateTimeFieldDateState | undefined => {
  if (date === '2026-04-14') return { tone: 'success', description: 'Spring holiday' };
  if (date === '2026-04-16') return { isTaken: true, description: 'Taken appointment' };
  if (date === '2026-04-18') return { isDisabled: true, description: 'Closed on weekends' };
  return undefined;
};
describe('calendar day states', () => {
  it('UIC-DATE-TIME-FIELD-3.4 highlights dates with descriptions and distinguishes taken dates from disabled dates', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Appointment"
          defaultValue="2026-04-15"
          getDateState={getDateState}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const holiday = screen.getByRole('button', { name: /Tuesday, April 14, 2026/ });
    expect(holiday).toHaveAttribute('data-tone', 'success');
    expect(holiday).toHaveAccessibleDescription('Spring holiday');
    const taken = screen.getByRole('button', { name: /Thursday, April 16, 2026/ });
    expect(taken).toHaveAttribute('data-taken', 'true');
    expect(taken).toHaveAttribute('aria-disabled', 'true');
    const disabled = screen.getByRole('button', { name: /Saturday, April 18, 2026/ });
    expect(disabled).not.toHaveAttribute('data-taken');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await user.click(taken);
    expect(onCommit).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', { slots: ['calendar-cell'] });
    await user.keyboard('{Escape}');
    act(() => screen.getByRole('spinbutton', { name: /^day/ }).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Choose an available date.')).toBeVisible();
  });
  it('UIC-DATE-TIME-FIELD-3.1 UIC-DATE-TIME-FIELD-3.4 rejects ranges and presets crossing disabled or taken dates', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Window"
          mode="date-range"
          value={{ start: '2026-04-15', end: '2026-04-17' }}
          getDateState={getDateState}
          presets={[
            { label: 'Crosses taken date', value: { start: '2026-04-15', end: '2026-04-17' } },
          ]}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-validation', 'invalid');
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crosses taken date' }),
    ).toBeDisabled();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

const isHoliday = (date: string) => date === '2026-04-15';

describe('ranges across unavailable days', () => {
  it('UIC-DATE-TIME-FIELD-3.7 picks a range across an unavailable day by its available ends', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Work week"
          mode="date-range"
          rangeAvailability="endpoints"
          defaultValue={{ start: '2026-04-06', end: '2026-04-07' }}
          isDateUnavailable={isHoliday}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Monday, April 13, 2026/ }));
    await user.click(within(dialog).getByRole('button', { name: /Friday, April 17, 2026/ }));
    expect(onCommit).toHaveBeenCalledWith({ start: '2026-04-13', end: '2026-04-17' });
    const holiday = within(dialog).getByRole('button', { name: /Wednesday, April 15, 2026/ });
    expect(holiday).toHaveAttribute('data-unavailable', 'true');
    expect(holiday).not.toHaveAttribute('data-selected');
    expect(
      within(dialog).getByRole('button', { name: /Thursday, April 16, 2026/ }),
    ).toHaveAttribute('data-selected', 'true');
  });

  it('UIC-DATE-TIME-FIELD-3.7 refuses an unavailable end and keeps the contiguous rule by default', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = render(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Work week"
          mode="date-range"
          rangeAvailability="endpoints"
          value={{ start: '2026-04-13', end: '2026-04-15' }}
          isDateUnavailable={isHoliday}
          presets={[{ label: 'Holiday week', value: { start: '2026-04-13', end: '2026-04-17' } }]}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveAttribute('data-validation', 'invalid');
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Holiday week' }),
    ).toBeEnabled();
    await user.keyboard('{Escape}');
    rerender(
      <UiProvider locale="en-US">
        <DateTimeField
          label="Work week"
          mode="date-range"
          value={{ start: '2026-04-13', end: '2026-04-17' }}
          isDateUnavailable={isHoliday}
          onCommit={onCommit}
        />
      </UiProvider>,
    );
    expect(root).toHaveAttribute('data-validation', 'invalid');
    expect(screen.getByText('Choose an available date.')).toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-3.7 submits the canonical interval and runs the caller validation on it', () => {
    const validate = vi.fn(() => null);
    const { container } = render(
      <UiProvider locale="en-US">
        <form>
          <DateTimeField
            label="Work week"
            mode="date-range"
            rangeAvailability="endpoints"
            startName="from"
            endName="to"
            defaultValue={{ start: '2026-04-13', end: '2026-04-17' }}
            isDateUnavailable={isHoliday}
            validate={validate}
          />
        </form>
      </UiProvider>,
    );
    expect(container.querySelector('.ui-field')).not.toHaveAttribute('data-validation', 'invalid');
    expect(validate).toHaveBeenCalledWith({ start: '2026-04-13', end: '2026-04-17' });
    const form = container.querySelector('form');
    if (!form) throw new Error('no form');
    expect([...new FormData(form).entries()]).toEqual([
      ['from', '2026-04-13'],
      ['to', '2026-04-17'],
    ]);
  });
});
