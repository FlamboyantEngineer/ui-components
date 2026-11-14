import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { readMenuIcons } from '../../../test/menu-fixtures.js';
import { CopyGlyph, EditGlyph } from '../../core/glyphs.js';
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

  it('UIC-CALENDAR-VIEW-5.1 draws Edit with the icon given, reporting the host action', async () => {
    const user = userEvent.setup();
    const onEventMenuAction = vi.fn();
    render(
      <Calendar
        eventMenu={['edit', { id: 'copy', label: 'Copy link', icon: CopyGlyph }]}
        eventMenuIcons={{ edit: EditGlyph }}
        onEventMenuAction={onEventMenuAction}
      />,
    );
    const menu = await openMenu('Design review');
    expect(readMenuIcons(menu)).toEqual({ Edit: 'edit', 'Copy link': 'copy' });
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEventMenuAction).toHaveBeenCalledWith('edit', events[0]);
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

  it('UIC-CALENDAR-VIEW-2.2 UIC-CALENDAR-VIEW-5.2 reports event presses without an editor', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    const onEventChange = vi.fn();
    render(<Calendar onEventAction={onEventAction} onEventChange={onEventChange} />);
    await user.click(eventButton('Design review'));
    expect(onEventAction).toHaveBeenCalledExactlyOnceWith('review');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onEventChange).not.toHaveBeenCalled();
  });
});
