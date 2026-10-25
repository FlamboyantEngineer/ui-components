import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { NotificationCenter } from './notification-center.js';
import type { NotificationItem } from './notification-list.js';

const now = new Date(2026, 4, 20, 10, 30);
const getNow = () => now;

const items: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Maria Santos mentioned you',
    actor: { name: 'Maria Santos' },
    time: new Date(2026, 4, 20, 10, 25).toISOString(),
  },
  { id: 'n2', title: 'Import finished', time: new Date(2026, 4, 20, 8, 0).toISOString() },
  {
    id: 'n3',
    title: 'Weekly digest',
    time: new Date(2026, 4, 18, 8, 0).toISOString(),
    isRead: true,
  },
];

/** Ends the drawer's slide: jsdom never scrolls, so the scroll end React Aria's sheet waits for is sent. */
async function settleSheet() {
  await act(async () => {
    for (const scroller of document.querySelectorAll('[data-sheet-scroll]')) {
      scroller.dispatchEvent(new Event('scrollend'));
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

const bell = () => screen.getByRole('button', { name: /^Notifications/ });

describe('NotificationCenter', () => {
  it('UIC-NOTIFICATION-CENTER-2.1 UIC-NOTIFICATION-CENTER-2.3 draws the bell with the unread count', () => {
    const { container, rerender } = render(
      <NotificationCenter
        items={items}
        getNow={getNow}
        className="extra"
        id="bell"
        data-lab="bell"
        data-open="caller"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('data-open');
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-notification-center', 'extra');
    expect(root).toHaveAttribute('id', 'bell');
    expect(root).toHaveAttribute('data-lab', 'bell');
    expect(root).toHaveAttribute('data-presentation', 'popover');
    expect(bell()).toHaveAccessibleName('Notifications, 2 unread');
    expect(bell()).toHaveClass('ui-notification-center__trigger', 'ui-button');
    expect(bell().querySelector('[data-glyph="bell"]')).not.toBeNull();
    const count = root.querySelector('.ui-notification-center__count');
    expect(count).toHaveClass('ui-badge');
    expect(count).toHaveAttribute('data-placement', 'overlay');
    expect(count).toHaveAttribute('aria-hidden', 'true');
    expect(count).toHaveTextContent('2');
    expectHooksMatchSpec(container, 'NOTIFICATION-CENTER', {
      slots: ['trigger', 'count', 'ui-notification-center__announcement'],
      callerAttributes: ['data-lab'],
    });
    rerender(<NotificationCenter items={items} unreadCount={250} countMax={9} />);
    expect(bell()).toHaveAccessibleName('Notifications, 250 unread');
    expect(root.querySelector('.ui-notification-center__count')).toHaveTextContent('9+');
    rerender(<NotificationCenter items={items} unreadCount={0} />);
    expect(bell()).toHaveAccessibleName('Notifications');
    expect(root.querySelector('.ui-notification-center__count')).toBeNull();
  });

  it('UIC-NOTIFICATION-CENTER-2.2 opens the list in a popover and closes back to the bell', async () => {
    const onOpenChange = vi.fn();
    const onReadChange = vi.fn();
    const { container } = render(
      <NotificationCenter
        items={items}
        getNow={getNow}
        onOpenChange={onOpenChange}
        onReadChange={onReadChange}
        data-lab="bell"
      />,
    );
    await userEvent.click(bell());
    const dialog = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(container.firstElementChild).toHaveAttribute('data-open', 'true');
    const panel = document.querySelector('.ui-notification-center__panel');
    expect(panel).toHaveClass('ui-popover');
    expect(panel).toHaveAttribute('data-placement');
    const list = dialog.querySelector('.ui-notification-list');
    expect(list).not.toBeNull();
    // Caller attributes stay on the bell's root.
    expect(list).not.toHaveAttribute('data-lab');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'Mark as read' })[0]!);
    expect(onReadChange).toHaveBeenCalledWith('n1', true);
    expectHooksMatchSpec(document.body, 'NOTIFICATION-CENTER', {
      slots: ['panel', 'trigger'],
      callerAttributes: ['data-lab'],
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    // Focus goes back to the bell on the frame after the popover unmounts.
    await waitFor(() => expect(bell()).toHaveFocus());
  });

  it('UIC-NOTIFICATION-CENTER-2.2 opens a drawer with a title and controlled state', async () => {
    // jsdom lacks what React Aria's sheet observes and scrolls with.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    Element.prototype.scrollTo = () => {};
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <NotificationCenter
        items={items}
        getNow={getNow}
        presentation="drawer"
        title="Inbox"
        isOpen
        onOpenChange={onOpenChange}
      />,
    );
    await settleSheet();
    const dialog = await screen.findByRole('dialog', { name: 'Inbox' });
    expect(document.querySelector('.ui-notification-center__panel')).toHaveClass('ui-drawer');
    expect(document.querySelector('.ui-notification-center')).toHaveAttribute(
      'data-presentation',
      'drawer',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(
      <NotificationCenter items={items} presentation="drawer" title="Inbox" isOpen={false} />,
    );
    await settleSheet();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    vi.unstubAllGlobals();
    // @ts-expect-error -- jsdom has no scrollTo; the stub goes away with the test.
    delete Element.prototype.scrollTo;
  });

  it('UIC-NOTIFICATION-CENTER-3.1 announces arrivals once, open or closed', async () => {
    const { container, rerender } = render(<NotificationCenter items={items} getNow={getNow} />);
    const status = container.querySelector('.ui-notification-center__announcement');
    expect(status).toHaveAttribute('role', 'status');
    const arrival = {
      id: 'n4',
      title: 'Ada Park assigned you',
      time: new Date(2026, 4, 20, 10, 29).toISOString(),
    };
    rerender(<NotificationCenter items={[arrival, ...items]} getNow={getNow} />);
    expect(status).toHaveTextContent('New notification: Ada Park assigned you');
    await userEvent.click(bell());
    const dialog = await screen.findByRole('dialog');
    const second = {
      id: 'n5',
      title: 'Lee Chen approved',
      time: new Date(2026, 4, 20, 10, 30).toISOString(),
    };
    rerender(<NotificationCenter items={[second, arrival, ...items]} getNow={getNow} />);
    expect(status).toHaveTextContent('New notification: Lee Chen approved');
    expect(dialog.querySelector('.ui-notification-list__announcement')).toHaveTextContent('');
  });
});
