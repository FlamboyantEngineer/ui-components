import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import type { CalendarEventMenuEntry } from './calendar-event-menu.js';
import { CalendarView, type CalendarViewEvent, type CalendarViewProps } from './calendar-view.js';

const getNow = () => new Date('2026-03-18T10:00:00Z');

const events: CalendarViewEvent[] = [
  { id: 'review', title: 'Design review', start: '2026-03-18T14:00', end: '2026-03-18T15:30' },
  { id: 'release', title: 'Release', start: '2026-03-20', isReadOnly: true },
];

const hostMenu: CalendarEventMenuEntry[] = ['edit', { id: 'copy', label: 'Copy link' }];

type Change = (next: CalendarViewEvent, previous: CalendarViewEvent) => void;

/** A host that owns the events and applies every change. */
function Calendar({
  onEventChange,
  initial = events,
  ...props
}: Partial<CalendarViewProps> & { onEventChange?: Change; initial?: CalendarViewEvent[] }) {
  const [current, setCurrent] = useState(initial);
  return (
    <UiProvider locale="en-US">
      <CalendarView
        events={current}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-18"
        onEventChange={(next, previous) => {
          setCurrent((list) => list.map((event) => (event.id === next.id ? next : event)));
          onEventChange?.(next, previous);
        }}
        {...props}
      />
    </UiProvider>
  );
}

/** A calendar whose events the test owns. */
function Fixed({
  events: shown,
  onEventChange,
}: {
  events: CalendarViewEvent[];
  onEventChange: Change;
}) {
  return (
    <UiProvider locale="en-US">
      <CalendarView
        events={shown}
        timeZone="UTC"
        getNow={getNow}
        defaultDate="2026-03-18"
        onEventChange={onEventChange}
      />
    </UiProvider>
  );
}

const plain = (text: string | null) => (text ?? '').replace(/[\u00a0\u2009\u202f]/g, ' ');
const eventButton = (title: string) =>
  screen.getByRole('button', { name: (name) => plain(name).startsWith(`${title},`) });

async function openMenu(title: string) {
  fireEvent.contextMenu(eventButton(title));
  return screen.findByRole('menu', { name: `${title} actions` });
}

const items = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

describe('CalendarView event menus', () => {
  it('UIC-CALENDAR-VIEW-5.1 lists Edit for editable events and the host entries always', async () => {
    const user = userEvent.setup();
    const onEventMenuAction = vi.fn();
    render(<Calendar eventMenu={hostMenu} onEventMenuAction={onEventMenuAction} />);
    let menu = await openMenu('Design review');
    expect(items(menu)).toEqual(['Edit', 'Copy link']);
    await user.click(within(menu).getByRole('menuitem', { name: 'Copy link' }));
    expect(onEventMenuAction).toHaveBeenCalledWith('copy', events[0]);
    menu = await openMenu('Release');
    expect(items(menu)).toEqual(['Copy link']);
  });

  it('UIC-CALENDAR-VIEW-5.1 leaves the browser menu without entries or changes', () => {
    render(
      <UiProvider locale="en-US">
        <CalendarView events={events} timeZone="UTC" getNow={getNow} defaultDate="2026-03-18" />
      </UiProvider>,
    );
    expect(fireEvent.contextMenu(eventButton('Design review'))).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CALENDAR-VIEW-5.1 opens from the keyboard and gives focus back to the event', async () => {
    const user = userEvent.setup();
    render(<Calendar />);
    eventButton('Design review').focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = await screen.findByRole('menu', { name: 'Design review actions' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(menu).not.toBeInTheDocument());
    await waitFor(() => expect(eventButton('Design review')).toHaveFocus());
  });

  it('UIC-CALENDAR-VIEW-5.2 edits the title and saves, or cancels without a change', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} />);
    let menu = await openMenu('Design review');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    let dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    const title = within(dialog).getByRole('textbox', { name: /Title/ });
    expect(title).toHaveValue('Design review');
    expect(within(dialog).getByRole('checkbox', { name: 'All day' })).not.toBeChecked();
    await user.clear(title);
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.type(title, ' Design sync ');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onEventChange).toHaveBeenCalledWith({ ...events[0], title: 'Design sync' }, events[0]);
    await waitFor(() => expect(eventButton('Design sync')).toHaveFocus());
    menu = await openMenu('Design sync');
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    await user.type(within(dialog).getByRole('textbox', { name: /Title/ }), ' later');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onEventChange).toHaveBeenCalledTimes(1);
    expect(eventButton('Design sync')).toBeInTheDocument();
  });

  it('UIC-CALENDAR-VIEW-5.2 makes an event all-day over the days it covered', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    render(<Calendar onEventChange={onEventChange} />);
    await user.click(
      within(await openMenu('Design review')).getByRole('menuitem', { name: 'Edit' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    await user.click(within(dialog).getByRole('checkbox', { name: 'All day' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onEventChange).toHaveBeenCalledWith(
      { ...events[0], start: '2026-03-18', end: '2026-03-18' },
      events[0],
    );
  });

  it('UIC-CALENDAR-VIEW-5.2 closes when its event leaves, giving focus to the day', async () => {
    const user = userEvent.setup();
    const onEventChange = vi.fn();
    const { rerender } = render(<Fixed events={events} onEventChange={onEventChange} />);
    await user.click(
      within(await openMenu('Design review')).getByRole('menuitem', { name: 'Edit' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    // The host removes the event while the editor is open.
    rerender(<Fixed events={events.slice(1)} onEventChange={onEventChange} />);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('gridcell', { name: /March 18/ })).toHaveFocus());
    expect(onEventChange).not.toHaveBeenCalled();
  });

  it('UIC-CALENDAR-VIEW-5.2 shows the host values in fields the reader left alone', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Fixed events={events} onEventChange={vi.fn()} />);
    await user.click(
      within(await openMenu('Design review')).getByRole('menuitem', { name: 'Edit' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    const renamed = events.map((event) =>
      event.id === 'review' ? { ...event, title: 'Renamed' } : event,
    );
    rerender(<Fixed events={renamed} onEventChange={vi.fn()} />);
    expect(within(dialog).getByRole('textbox', { name: /Title/ })).toHaveValue('Renamed');
    // A read-only event closes the editor.
    rerender(
      <Fixed
        events={renamed.map((event) => ({ ...event, isReadOnly: true }))}
        onEventChange={vi.fn()}
      />,
    );
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('UIC-CALENDAR-VIEW-2.2 UIC-CALENDAR-VIEW-5.2 opens the editor on a single press of an editable event', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    const onEventChange = vi.fn();
    render(<Calendar onEventAction={onEventAction} onEventChange={onEventChange} />);
    await user.click(eventButton('Design review'));
    expect(onEventAction).toHaveBeenCalledExactlyOnceWith('review');
    const dialog = await screen.findByRole('dialog', { name: 'Edit event' });
    expect(within(dialog).getByRole('textbox', { name: /Title/ })).toHaveValue('Design review');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await waitFor(() => expect(eventButton('Design review')).toHaveFocus());
    expect(onEventChange).not.toHaveBeenCalled();
    // Enter opens it too; a read-only event only reports its press.
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog', { name: 'Edit event' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Edit event' })).not.toBeInTheDocument(),
    );
    await user.click(eventButton('Release'));
    expect(onEventAction).toHaveBeenLastCalledWith('release');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
