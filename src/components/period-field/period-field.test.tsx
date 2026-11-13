import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PeriodField } from './period-field.js';

const trigger = (name: RegExp) => screen.getByRole('button', { name });
const periods = () => within(screen.getByRole('listbox')).getAllByRole('option');

describe('PeriodField', () => {
  it('UIC-PERIOD-FIELD-1.1 UIC-PERIOD-FIELD-1.2 picks a month and submits it as YYYY-MM', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <UiProvider timeZone="Pacific/Kiritimati">
        <form aria-label="Report">
          <PeriodField label="Period" name="period" defaultValue="2026-03" onChange={onChange} />
        </form>
      </UiProvider>,
    );
    expect(trigger(/^Period/)).toHaveAccessibleName('Period March 2026');
    await user.click(trigger(/^Period/));
    expect(screen.getByRole('listbox')).toHaveAccessibleName('2026');
    expect(periods().map((option) => option.textContent)).toEqual([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]);
    expect(screen.getByRole('option', { name: 'March 2026' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'March 2026' })).toHaveFocus();
    await user.click(screen.getByRole('option', { name: 'April 2026' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-04');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Report' });
    expect(new FormData(form).get('period')).toBe('2026-04');
    expectHooksMatchSpec(document.body, 'PERIOD-FIELD', { slots: ['trigger', 'value'] });
  });

  it('UIC-PERIOD-FIELD-1.3 pages years, disables periods beyond the bounds and flags a value beyond them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PeriodField
        label="Season"
        granularity="year"
        minValue="2019"
        maxValue="2030"
        defaultValue="2031"
        validationMode="immediate"
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Choose a value on or before 2030.')).toBeInTheDocument();
    await user.click(trigger(/^Season/));
    expect(screen.getByRole('listbox')).toHaveAccessibleName('2028 – 2039');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('option', { name: '2031' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('listbox')).toHaveAccessibleName('2016 – 2027');
    expect(screen.getByRole('option', { name: '2018' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('option', { name: '2020' }));
    expect(onChange).toHaveBeenLastCalledWith('2020');
    expect(screen.queryByText('Choose a value on or before 2030.')).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'PERIOD-FIELD', { slots: ['trigger'] });
  });

  it('UIC-PERIOD-FIELD-1.1 shows an unreadable value as itself and clears with Delete', async () => {
    const user = userEvent.setup();
    render(<PeriodField label="Period" defaultValue="2026-3" validationMode="immediate" />);
    expect(trigger(/^Period/)).toHaveTextContent('2026-3');
    expect(screen.getByText('Enter a valid date.')).toBeInTheDocument();
    trigger(/^Period/).focus();
    await user.keyboard('{Delete}');
    expect(trigger(/^Period/)).toHaveTextContent('Select an option');
  });

  it('UIC-PERIOD-FIELD-1.2 closes when the chosen period is picked again', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<PeriodField label="Period" defaultValue="2026-03" onCommit={onCommit} />);
    await user.click(trigger(/^Period/));
    await user.click(screen.getByRole('option', { name: 'March 2026' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger(/^Period/)).toHaveAccessibleName('Period March 2026');
    await user.click(trigger(/^Period/));
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger(/^Period/)).toHaveAccessibleName('Period March 2026');
  });

  it('UIC-PERIOD-FIELD-1.1 names Gregorian months where the locale counts other months', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="fa-IR">
        <PeriodField label="Period" defaultValue="2026-03" />
      </UiProvider>,
    );
    const name = new Intl.DateTimeFormat('fa-IR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
      calendar: 'gregory',
    }).format(Date.UTC(2026, 2, 1));
    expect(trigger(/^Period/)).toHaveAccessibleName(`Period ${name}`);
    await user.click(trigger(/^Period/));
    expect(screen.getByRole('option', { name })).toHaveAttribute('aria-selected', 'true');
  });
});
