import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Section } from '../section-header/section-header.js';
import { NotificationList, type NotificationItem } from './notification-list.js';

const now = new Date(2026, 4, 20, 10, 30);
const getNow = () => now;

const items: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Maria Santos mentioned you',
    description: 'Requirement 12',
    actor: { name: 'Maria Santos' },
    time: new Date(2026, 4, 20, 10, 25).toISOString(),
    href: '/requirements/12',
  },
  {
    id: 'n2',
    title: 'Import finished',
    icon: 'success',
    time: new Date(2026, 4, 20, 8, 0).toISOString(),
    isRead: true,
  },
  {
    id: 'n3',
    title: 'Jon Berg replied',
    actor: { name: 'Jon Berg' },
    time: new Date(2026, 4, 19, 16, 0).toISOString(),
  },
  {
    id: 'n4',
    title: 'Weekly digest',
    time: new Date(2026, 4, 12, 9, 0).toISOString(),
    isRead: true,
  },
  { id: 'n5', title: 'Old reminder', time: new Date(2025, 11, 30, 9, 0).toISOString() },
  { id: 'n6', title: 'Undated note', time: 'soon', isRead: true },
];

const row = (title: string) =>
  screen.getByText(title).closest<HTMLElement>('.ui-notification-list__item') as HTMLElement;

describe('NotificationList', () => {
  it('UIC-NOTIFICATION-CENTER-1.1 UIC-NOTIFICATION-CENTER-1.9 draws each notification as a list row', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <NotificationList
        items={items}
        getNow={getNow}
        onAction={onAction}
        className="extra"
        id="inbox"
        data-lab="inbox"
        data-filter="caller"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-notification-list', 'extra');
    expect(root).toHaveAttribute('id', 'inbox');
    expect(root).toHaveAttribute('data-lab', 'inbox');
    expect(root).toHaveAttribute('data-filter', 'all');
    const mention = row('Maria Santos mentioned you');
    expect(mention).toHaveClass('ui-list-row');
    expect(mention.querySelector('.ui-notification-list__actor')).toHaveClass('ui-avatar');
    expect(mention.querySelector('.ui-meta-line')).toHaveTextContent(
      'Maria Santos · Requirement 12 · 5 minutes ago',
    );
    const time = mention.querySelector('.ui-notification-list__time');
    expect(time).toHaveClass('ui-relative-time');
    expect(time).not.toHaveAttribute('tabindex');
    const link = within(mention).getByRole('link');
    expect(link).toHaveAttribute('href', '/requirements/12');
    expect(row('Import finished').querySelector('[data-glyph="success"]')).not.toBeNull();
    await userEvent.click(within(row('Import finished')).getByRole('button', { name: /Import/ }));
    expect(onAction).toHaveBeenCalledWith('n2');
    expectHooksMatchSpec(container, 'NOTIFICATION-CENTER', {
      slots: [
        'toolbar',
        'filter',
        'group',
        'group-title',
        'list',
        'item',
        'actor',
        'time',
        'unread',
      ],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-NOTIFICATION-CENTER-1.1 draws read-only rows without onAction', () => {
    render(<NotificationList items={[items[1] as NotificationItem]} getNow={getNow} />);
    expect(within(row('Import finished')).queryByRole('button')).not.toBeInTheDocument();
    expect(row('Import finished')).toHaveAttribute('data-kind', 'static');
  });

  it('UIC-NOTIFICATION-CENTER-1.2 groups the rows by day under named headings', () => {
    const { container } = render(<NotificationList items={items} getNow={getNow} />);
    const groups = [...container.querySelectorAll('.ui-notification-list__group')];
    expect(groups.map((group) => group.querySelector('h3')?.textContent)).toEqual([
      'Today',
      'Yesterday',
      'Tuesday, May 12',
      'Tuesday, December 30, 2025',
      'Earlier',
    ]);
    expect(groups.map((group) => group.getAttribute('data-day'))).toEqual([
      '2026-05-20',
      '2026-05-19',
      '2026-05-12',
      '2025-12-30',
      null,
    ]);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    const today = screen.getByRole('list', { name: 'Today' });
    expect(today).toHaveClass('ui-notification-list__list', 'ui-list');
    expect(today.parentElement).toBe(groups[0]);
    expect(within(today).getAllByRole('listitem')).toHaveLength(2);
  });

  it('UIC-NOTIFICATION-CENTER-1.2 takes the heading level from the enclosing section', () => {
    render(
      <Section title="Inbox" headingLevel={2}>
        <NotificationList items={items.slice(0, 1)} getNow={getNow} />
      </Section>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Today' })).toBeInTheDocument();
  });

  it('UIC-NOTIFICATION-CENTER-1.3 marks unread rows', () => {
    render(<NotificationList items={items} getNow={getNow} />);
    expect(row('Maria Santos mentioned you')).toHaveAttribute('data-unread', 'true');
    expect(row('Import finished')).not.toHaveAttribute('data-unread');
    const dot = row('Jon Berg replied').querySelector('.ui-notification-list__unread');
    expect(dot).toHaveClass('ui-badge');
    expect(dot).toHaveTextContent('Unread');
    expect(row('Import finished').querySelector('.ui-notification-list__unread')).toBeNull();
  });

  it('UIC-NOTIFICATION-CENTER-1.4 marks rows read or unread, dismisses them and draws caller actions', async () => {
    const onReadChange = vi.fn();
    const onDismiss = vi.fn();
    const { container } = render(
      <NotificationList
        items={items.slice(0, 2)}
        getNow={getNow}
        onReadChange={onReadChange}
        onDismiss={onDismiss}
        renderActions={(item) => <button type="button">Accept {item.title}</button>}
      />,
    );
    const unread = row('Maria Santos mentioned you');
    await userEvent.click(within(unread).getByRole('button', { name: 'Mark as read' }));
    expect(onReadChange).toHaveBeenLastCalledWith('n1', true);
    expect(unread.querySelector('.ui-notification-list__read-toggle [data-glyph]')).toHaveAttribute(
      'data-glyph',
      'envelope-open',
    );
    const read = row('Import finished');
    await userEvent.click(within(read).getByRole('button', { name: 'Mark as unread' }));
    expect(onReadChange).toHaveBeenLastCalledWith('n2', false);
    await userEvent.click(within(read).getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledWith('n2');
    const actions = read.querySelector('.ui-notification-list__item-actions');
    expect(actions).toHaveTextContent('Accept Import finished');
    // The caller's controls come before the built-in ones, outside the row's link.
    expect(actions?.nextElementSibling).toHaveClass('ui-notification-list__read-toggle');
    expect(unread.querySelector('a button')).toBeNull();
    expectHooksMatchSpec(container, 'NOTIFICATION-CENTER', {
      slots: ['item-actions', 'read-toggle', 'dismiss'],
    });
  });

  it('UIC-NOTIFICATION-CENTER-1.5 filters to unread notifications', async () => {
    const onFilterChange = vi.fn();
    const { container, rerender } = render(
      <NotificationList items={items} getNow={getNow} onFilterChange={onFilterChange} />,
    );
    const filter = screen.getByRole('radiogroup', { name: 'Show' });
    expect(filter).toHaveClass('ui-notification-list__filter', 'ui-segmented-choice');
    const unread = within(filter).getByRole('radio', { name: 'Unread, 3' });
    await userEvent.click(unread);
    expect(onFilterChange).toHaveBeenCalledWith('unread');
    expect(container.firstElementChild).toHaveAttribute('data-filter', 'unread');
    expect(screen.queryByText('Import finished')).not.toBeInTheDocument();
    expect(screen.getByText('Jon Berg replied')).toBeInTheDocument();
    rerender(<NotificationList items={items} getNow={getNow} filter="all" unreadCount={42} />);
    expect(screen.getByText('Import finished')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Unread, 42' })).toBeInTheDocument();
  });

  it('UIC-NOTIFICATION-CENTER-1.6 marks all read and draws the caller controls', async () => {
    const onMarkAllRead = vi.fn();
    const { rerender } = render(
      <NotificationList
        items={items}
        getNow={getNow}
        onMarkAllRead={onMarkAllRead}
        actions={<a href="/settings">Settings</a>}
      />,
    );
    const button = screen.getByRole('button', { name: 'Mark all as read' });
    expect(button).toHaveClass('ui-notification-list__mark-all-read', 'ui-button');
    await userEvent.click(button);
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Settings' }).parentElement).toHaveClass(
      'ui-notification-list__actions',
    );
    rerender(
      <NotificationList
        items={items}
        getNow={getNow}
        onMarkAllRead={onMarkAllRead}
        unreadCount={0}
      />,
    );
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  it('UIC-NOTIFICATION-CENTER-1.7 shows the empty and loading states', () => {
    const { container, rerender, unmount } = render(<NotificationList items={[]} isLoading />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root.querySelector('.ui-notification-list__empty')).toHaveAttribute(
      'data-variant',
      'loading',
    );
    rerender(<NotificationList items={[]} />);
    expect(root).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('heading', { name: 'No notifications' })).toBeInTheDocument();
    expect(screen.getByText('New notifications appear here.')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'NOTIFICATION-CENTER', { slots: ['empty'] });
    unmount();
    render(<NotificationList items={items.slice(1, 2)} defaultFilter="unread" />);
    expect(screen.getByRole('heading', { name: 'Nothing unread' })).toBeInTheDocument();
    expect(screen.getByText('You are all caught up.')).toBeInTheDocument();
  });

  it('UIC-NOTIFICATION-CENTER-1.8 loads more while more exist', async () => {
    const onLoadMore = vi.fn();
    const { container, rerender } = render(
      <NotificationList items={items} getNow={getNow} hasMore onLoadMore={onLoadMore} />,
    );
    const loadMore = container.querySelector('.ui-notification-list__load-more');
    expect(loadMore).toHaveClass('ui-load-more');
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalled();
    rerender(
      <NotificationList items={items} getNow={getNow} hasMore isLoading onLoadMore={onLoadMore} />,
    );
    expect(screen.getByRole('button', { name: /Load more/ })).toHaveAttribute(
      'data-pending',
      'true',
    );
    rerender(<NotificationList items={[]} getNow={getNow} hasMore onLoadMore={onLoadMore} />);
    expect(container.querySelector('.ui-notification-list__load-more')).toBeNull();
    expectHooksMatchSpec(container, 'NOTIFICATION-CENTER', { slots: ['empty'] });
  });

  it('UIC-NOTIFICATION-CENTER-3.1 announces notifications that arrive', () => {
    const first = items.slice(0, 2);
    const { container, rerender } = render(<NotificationList items={first} getNow={getNow} />);
    const status = container.querySelector('.ui-notification-list__announcement') as HTMLElement;
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveTextContent('');
    const arrival = {
      id: 'n7',
      title: 'Ada Park assigned you',
      time: new Date(2026, 4, 20, 10, 29).toISOString(),
    };
    rerender(<NotificationList items={[arrival, ...first]} getNow={getNow} />);
    expect(status).toHaveTextContent('New notification: Ada Park assigned you');
    const later = [
      { ...arrival, id: 'n8', time: new Date(2026, 4, 20, 10, 30).toISOString() },
      { ...arrival, id: 'n9', time: new Date(2026, 4, 20, 10, 30).toISOString() },
      { ...arrival, id: 'n10', time: new Date(2026, 4, 20, 10, 31).toISOString(), isRead: true },
    ];
    rerender(<NotificationList items={[...later, arrival, ...first]} getNow={getNow} />);
    expect(status).toHaveTextContent('2 new notifications');
    // An older page loaded at the end is not an arrival.
    rerender(
      <NotificationList items={[...later, arrival, ...first, ...items.slice(2)]} getNow={getNow} />,
    );
    expect(status).toHaveTextContent('2 new notifications');
  });

  it('UIC-NOTIFICATION-CENTER-3.1 does not announce the first page of a list that started empty', () => {
    const { container, rerender } = render(<NotificationList items={[]} isLoading />);
    rerender(<NotificationList items={items} getNow={getNow} />);
    expect(container.querySelector('.ui-notification-list__announcement')).toHaveTextContent('');
  });

  it('UIC-NOTIFICATION-CENTER-3.2 makes each day one tab stop with arrow keys between rows', async () => {
    render(<NotificationList items={items.slice(0, 3)} getNow={getNow} onAction={() => {}} />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'All' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: /Maria Santos mentioned you/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /Import finished/ })).toHaveFocus();
  });
});
