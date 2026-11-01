import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { CalendarView } from './calendar-view.js';

const getNow = () => new Date('2026-03-18T10:00:00Z');
const day = (date: string) => document.querySelector<HTMLElement>(`[data-date="${date}"]`);

function Calendar({ date }: { date: string }) {
  return (
    <UiProvider locale="en-US">
      <input aria-label="Notes" />
      <CalendarView
        events={[]}
        timeZone="UTC"
        getNow={getNow}
        date={date}
        onDateChange={() => {}}
      />
    </UiProvider>
  );
}

/** A host that applies each date the calendar asks for, as an ordinary controlled owner. */
function Accepting() {
  const [date, setDate] = useState('2026-03-02');
  return (
    <UiProvider locale="en-US">
      <CalendarView events={[]} timeZone="UTC" getNow={getNow} date={date} onDateChange={setDate} />
    </UiProvider>
  );
}

const wait = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe('CalendarView keyboard moves the owner declines', () => {
  it('UIC-CALENDAR-VIEW-4.2 does not take focus when the declined day arrives later', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Calendar date="2026-03-02" />);
    act(() => day('2026-03-02')?.focus());
    await user.keyboard('{ArrowRight}');
    expect(day('2026-03-02')).toHaveFocus();
    await wait();
    const notes = screen.getByRole('textbox', { name: 'Notes' });
    act(() => notes.focus());
    rerender(<Calendar date="2026-03-03" />);
    expect(notes).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-4.2 keeps focus on its day when the declined day arrives later', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Calendar date="2026-03-02" />);
    act(() => day('2026-03-02')?.focus());
    await user.keyboard('{ArrowRight}');
    await wait();
    rerender(<Calendar date="2026-03-03" />);
    expect(day('2026-03-02')).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-4.2 leaves focus that moved out of the grid before the move renders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Calendar date="2026-03-02" />);
    act(() => day('2026-03-02')?.focus());
    await user.keyboard('{ArrowRight}');
    const notes = screen.getByRole('textbox', { name: 'Notes' });
    act(() => notes.focus());
    rerender(<Calendar date="2026-03-03" />);
    expect(notes).toHaveFocus();
  });

  it('UIC-CALENDAR-VIEW-4.2 follows a move the owner applies at once', async () => {
    const user = userEvent.setup();
    render(<Accepting />);
    act(() => day('2026-03-02')?.focus());
    await user.keyboard('{ArrowRight}');
    expect(day('2026-03-03')).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(day('2026-04-03')).toHaveFocus();
  });
});
