import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ja } from '../../core/locales/index.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField, type DateTimeFieldProps } from './date-time-field.js';

function renderField(props: Partial<DateTimeFieldProps<'date' | 'date-range'>>, locale = 'en-US') {
  return render(
    <UiProvider locale={locale} messages={locale === 'ja-JP' ? ja : undefined}>
      <DateTimeField<'date' | 'date-range'> label="Due" {...props} />
    </UiProvider>,
  );
}

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  const [button] = document.getElementsByClassName('ui-date-time-field__button');
  if (!button) throw new Error('no calendar button');
  await user.click(button);
  return screen.getByRole('dialog');
}

const weekdays = (dialog: HTMLElement) =>
  [...dialog.querySelectorAll('.ui-date-time-field__calendar-weekday')].map(
    (cell) => cell.textContent,
  );

describe('DateTimeField weeks', () => {
  it('UIC-DATE-TIME-FIELD-3.6 starts the weeks on the day the caller sets', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-04-13', firstDayOfWeek: 'wed' });
    const dialog = await openCalendar(user);
    expect(weekdays(dialog)).toEqual(['W', 'T', 'F', 'S', 'S', 'M', 'T']);
    const [firstRow] = within(dialog).getAllByRole('row');
    const firstDay = within(firstRow as HTMLElement).getAllByRole('button')[0];
    expect(firstDay).toHaveAccessibleName(/Wednesday, April 1, 2026/);
  });

  it('UIC-DATE-TIME-FIELD-3.6 keeps the locale week start by default', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-04-13' }, 'fr-FR');
    const dialog = await openCalendar(user);
    expect(weekdays(dialog)[0]).toBe('L');
    expect(dialog.querySelector('.ui-date-time-field__calendar-week')).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-3.6 numbers ISO weeks as row headers from Monday across the year', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-12-30', weekNumbers: 'iso' });
    const dialog = await openCalendar(user);
    expect(weekdays(dialog)[0]).toBe('M');
    const weeks = within(dialog).getAllByRole('rowheader');
    expect(weeks.map((week) => week.textContent)).toEqual(['49', '50', '51', '52', '53']);
    expect(weeks[4]).toHaveAccessibleName('Week 53');
    expect(dialog.querySelector('.ui-date-time-field__calendar-week-label')).toHaveTextContent(
      'Wk',
    );
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', {
      slots: ['calendar-week', 'calendar-week-label'],
    });
  });

  it('UIC-DATE-TIME-FIELD-3.6 numbers weeks by the locale rule', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-12-30', weekNumbers: 'locale' });
    const dialog = await openCalendar(user);
    // Weeks from Sunday; the week of 27 December holds 1 January 2027, so it is week 1.
    expect(weekdays(dialog)[0]).toBe('S');
    const weeks = within(dialog).getAllByRole('rowheader');
    expect(weeks.at(-1)).toHaveTextContent('1');
  });

  it('UIC-DATE-TIME-FIELD-3.6 keeps week numbers out of the keyboard path and the selection', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderField({ defaultValue: '2026-04-13', weekNumbers: 'iso', onCommit });
    const dialog = await openCalendar(user);
    const monday = within(dialog).getByRole('button', { name: /Monday, April 13, 2026/ });
    expect(monday).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(within(dialog).getByRole('button', { name: /Sunday, April 12, 2026/ })).toHaveFocus();
    await user.click(within(dialog).getAllByRole('rowheader')[0] as HTMLElement);
    expect(onCommit).not.toHaveBeenCalled();
    expect(within(dialog).getAllByRole('rowheader')[0]).not.toHaveAttribute('tabindex');
  });

  it('UIC-DATE-TIME-FIELD-3.6 numbers the weeks of every visible month in the locale', async () => {
    const user = userEvent.setup();
    renderField(
      { mode: 'date-range', defaultValue: null, visibleMonths: 2, weekNumbers: 'iso' },
      'ja-JP',
    );
    const dialog = await openCalendar(user);
    const grids = within(dialog).getAllByRole('grid');
    expect(grids).toHaveLength(2);
    for (const grid of grids) {
      expect(within(grid).getAllByRole('rowheader').length).toBeGreaterThan(3);
    }
    expect(within(grids[0] as HTMLElement).getAllByRole('rowheader')[0]).toHaveAccessibleName(
      /^第\d+週$/,
    );
  });
});
