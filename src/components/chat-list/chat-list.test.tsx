import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { HistoryGlyph, SparklesGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { type ChatConversation, ChatList } from './chat-list.js';

const getNow = () => new Date('2026-04-20T10:30:00');

const conversations: ChatConversation[] = [
  {
    id: 'ana',
    title: 'Ana Lima',
    lastMessage: 'The museum opens at nine.',
    time: '2026-04-20T10:12:00',
    unreadCount: 2,
    participants: [{ id: 'ana', name: 'Ana Lima', presence: 'active' }],
  },
  {
    id: 'trip',
    title: 'Lisbon trip',
    lastMessage: 'Ben: I booked the café table.',
    time: '2026-04-19T18:00:00',
    unreadCount: 140,
    isMuted: true,
    participants: [
      { id: 'ben', name: 'Ben Ode' },
      { id: 'chen', name: 'Chen Wu' },
      { id: 'dia', name: 'Dia Rao' },
    ],
  },
  {
    id: 'helper',
    title: 'Travel helper',
    lastMessage: 'Here are three walking routes.',
    avatar: { name: 'Travel helper', shape: 'rounded' },
  },
];

const grid = () => screen.getByRole('grid', { name: 'Conversations' });
const row = (name: RegExp | string) => within(grid()).getByRole('row', { name });

describe('ChatList', () => {
  it('UIC-CHAT-LIST-1.1 UIC-CHAT-LIST-1.2 UIC-CHAT-LIST-1.10 draws a search field, New chat and a row per conversation', () => {
    const { container } = render(
      <ChatList
        conversations={conversations}
        showSearch
        onNew={() => {}}
        getNow={getNow}
        className="host"
        id="inbox"
        data-host-list="side"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-chat-list', 'host');
    expect(root).toHaveAttribute('id', 'inbox');
    expect(root).toHaveAttribute('data-host-list', 'side');
    expect(screen.getByRole('searchbox', { name: 'Search conversations' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'New chat' })).toHaveClass('ui-chat-list__new');
    expect(grid()).toHaveClass('ui-chat-list__list');
    const rows = within(grid()).getAllByRole('row');
    expect(rows).toHaveLength(3);
    const [ana, trip, helper] = rows as [HTMLElement, HTMLElement, HTMLElement];
    expect(ana.querySelector('.ui-chat-list__title')).toHaveTextContent('Ana Lima');
    expect(ana.querySelector('.ui-chat-list__time')).toHaveTextContent('18 minutes ago');
    expect(ana.querySelector('.ui-chat-list__preview')).toHaveTextContent(
      'The museum opens at nine.',
    );
    expect(ana.querySelector('.ui-chat-list__avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(ana.querySelector('.ui-avatar')).toHaveAttribute('data-status', 'active');
    expect(ana).toHaveAttribute('data-unread', 'true');
    expect(ana).not.toHaveAttribute('data-muted');
    expect(trip).toHaveAttribute('data-muted', 'true');
    expect(trip.querySelector('.ui-avatar-group .ui-avatar-group__overflow')).toHaveTextContent(
      '+1',
    );
    expect(trip.querySelector('.ui-chat-list__unread')).toHaveTextContent('99+');
    expect(trip.querySelector('.ui-chat-list__muted')).toHaveAccessibleName('Muted');
    expect(helper).not.toHaveAttribute('data-unread');
    expect(helper.querySelector('.ui-avatar')).toHaveAttribute('data-shape', 'rounded');
    expect(helper.querySelector('.ui-chat-list__time')).toBeNull();
    expect(within(helper).queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-LIST', {
      slots: [
        'header',
        'search',
        'new',
        'body',
        'list',
        'conversation',
        'avatar',
        'title',
        'time',
        'preview',
        'muted',
        'unread',
      ],
      callerAttributes: ['data-host-list'],
    });
  });

  it('UIC-CHAT-LIST-1.3 names each row by what it shows, then its last message', () => {
    render(<ChatList conversations={conversations} getNow={getNow} />);
    const ana = row(/^Ana Lima/);
    expect(ana).toHaveAccessibleName(
      'Ana Lima, Active, 2 unread messages, 18 minutes ago The museum opens at nine.',
    );
    expect(row(/^Lisbon trip/)).toHaveAccessibleName(
      'Lisbon trip, 140 unread messages, muted, 16 hours ago Ben: I booked the café table.',
    );
    expect(row(/^Travel helper/)).toHaveAccessibleName(
      'Travel helper Here are three walking routes.',
    );
    // The badge reads its count as words, hiding the bare number.
    const badge = ana.querySelector('.ui-chat-list__unread');
    expect(badge?.querySelector('.ui-badge__label')).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveTextContent('2 unread messages');
  });

  it('UIC-CHAT-LIST-1.3 reads the time with the caller fallback and zone in the row and its name', () => {
    const old: ChatConversation = { id: 'old', title: 'Old trip', time: '2026-04-16T09:00:00' };
    const { rerender } = render(<ChatList conversations={[old]} getNow={getNow} />);
    expect(row(/^Old trip/)).toHaveAccessibleName('Old trip, 4 days ago');
    rerender(
      <ChatList conversations={[old]} getNow={getNow} fallbackAfterDays={2} timeZone="UTC" />,
    );
    const time = row(/^Old trip/).querySelector('.ui-chat-list__time');
    expect(time).toHaveClass('ui-attribution');
    expect(time).toHaveTextContent('Apr 16, 2026, 9:00 AM');
    expect(row(/^Old trip/)).toHaveAccessibleName('Old trip, Apr 16, 2026, 9:00 AM');
  });

  it('UIC-CHAT-LIST-1.4 selects one conversation by press or key and reports it', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ChatList
        conversations={conversations}
        onSelectionChange={onSelectionChange}
        getNow={getNow}
      />,
    );
    await user.click(row(/^Lisbon trip/));
    expect(onSelectionChange).toHaveBeenLastCalledWith('trip');
    expect(row(/^Lisbon trip/)).toHaveAttribute('aria-selected', 'true');
    expect(row(/^Lisbon trip/)).toHaveAttribute('data-selected', 'true');
    await user.click(row(/^Lisbon trip/));
    expect(row(/^Lisbon trip/)).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(row(/^Travel helper/)).toHaveFocus();
    expect(row(/^Lisbon trip/)).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(onSelectionChange).toHaveBeenLastCalledWith('helper');
    await user.keyboard('{ArrowUp}{ArrowUp} ');
    expect(onSelectionChange).toHaveBeenLastCalledWith('ana');
    expect(row(/^Ana Lima/)).toHaveAttribute('aria-selected', 'true');
    expect(row(/^Travel helper/)).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-CHAT-LIST-1.4 shows the selection the host controls', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <ChatList
        conversations={conversations}
        selectedKey="helper"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(row(/^Travel helper/)).toHaveAttribute('aria-selected', 'true');
    await user.click(row(/^Ana Lima/));
    expect(onSelectionChange).toHaveBeenCalledWith('ana');
    expect(row(/^Travel helper/)).toHaveAttribute('aria-selected', 'true');
    rerender(<ChatList conversations={conversations} selectedKey={null} />);
    expect(row(/^Travel helper/)).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-CHAT-LIST-1.5 UIC-CHAT-LIST-1.3 is one tab stop with arrow keys and typeahead', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ChatList conversations={conversations} showSearch />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.tab();
    expect(row(/^Ana Lima/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(row(/^Travel helper/)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(row(/^Ana Lima/)).toHaveFocus();
    await user.keyboard('l');
    expect(row(/^Lisbon trip/)).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(row(/^Lisbon trip/)).toHaveFocus();
  });

  it('UIC-CHAT-LIST-1.6 UIC-CHAT-LIST-1.9 filters by title and last message, ignoring case and accents', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChatList conversations={conversations} showSearch />);
    const search = screen.getByRole('searchbox', { name: 'Search conversations' });
    await user.type(search, 'CAFE');
    expect(within(grid()).getAllByRole('row')).toHaveLength(1);
    expect(row(/^Lisbon trip/).querySelector('mark')).toHaveTextContent('café');
    await user.clear(search);
    await user.type(search, 'lima');
    expect(
      within(grid())
        .getAllByRole('row')
        .map((item) => item.getAttribute('data-key')),
    ).toEqual(['ana']);
    await user.type(search, 'zzz');
    expect(within(grid()).getByRole('row')).toHaveTextContent('No matching conversations');
    expect(container.querySelector('.ui-chat-list__empty')).not.toBeNull();
    await user.clear(search);
    expect(within(grid()).getAllByRole('row')).toHaveLength(3);
  });

  it('UIC-CHAT-LIST-1.6 reports the search to a host that searches itself', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<ChatList conversations={conversations} onSearchChange={onSearchChange} showSearch />);
    await user.type(screen.getByRole('searchbox'), 'zz');
    expect(onSearchChange).toHaveBeenLastCalledWith('zz');
    expect(within(grid()).getAllByRole('row')).toHaveLength(3);
  });

  it('UIC-CHAT-LIST-1.6 searches only while its field shows', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatList conversations={conversations} showSearch />);
    await user.type(screen.getByRole('searchbox'), 'zz');
    expect(within(grid()).getByRole('row')).toHaveTextContent('No matching conversations');
    // The field goes with its text still in it: nothing is left to clear it with.
    rerender(<ChatList conversations={conversations} />);
    expect(within(grid()).getAllByRole('row')).toHaveLength(3);
  });

  it('UIC-CHAT-LIST-1.11 hands a failed load to onLoadMoreError', async () => {
    const user = userEvent.setup();
    const refusal = new Error('offline');
    const onLoadMoreError = vi.fn();
    render(
      <ChatList
        conversations={conversations}
        onLoadMore={() => Promise.reject(refusal)}
        onLoadMoreError={onLoadMoreError}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(onLoadMoreError).toHaveBeenCalledWith(refusal));
  });

  it('UIC-CHAT-LIST-1.7 starts a new conversation', async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<ChatList conversations={[]} onNew={onNew} />);
    const button = screen.getByRole('button', { name: 'New chat' });
    expect(button.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'plus');
    await user.click(button);
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-LIST-1.8 stands placeholder rows in for loading conversations', () => {
    const { container } = render(<ChatList conversations={conversations} isLoading />);
    expect(container.firstElementChild).toHaveAttribute('data-loading', 'true');
    expect(container.querySelectorAll('.ui-chat-list__skeleton')).toHaveLength(4);
    expect(screen.getByRole('status')).toHaveTextContent('Loading conversations');
    expect(container.querySelector('[aria-busy="true"] [role="status"]')).toBeNull();
    expect(screen.queryByRole('row', { name: /Ana Lima/ })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-LIST', { slots: ['skeleton'] });
  });

  it('UIC-CHAT-LIST-1.9 shows the empty state without conversations', () => {
    const { container, rerender } = render(<ChatList conversations={[]} />);
    expect(grid()).toHaveAttribute('data-empty', 'true');
    expect(within(grid()).getByRole('row')).toHaveTextContent('No conversations yet');
    expectHooksMatchSpec(container, 'CHAT-LIST', { slots: ['empty'] });
    rerender(<ChatList conversations={[]} emptyState={<p>Say hello to your team.</p>} />);
    expect(container.querySelector('.ui-chat-list__empty')).toHaveTextContent(
      'Say hello to your team.',
    );
  });

  it('UIC-CHAT-LIST-1.1 takes its names from the labelling props and the provider', () => {
    const { rerender } = render(
      <UiProvider messages={{ conversations: 'Unterhaltungen', newChat: 'Neu' }}>
        <ChatList conversations={[]} onNew={() => {}} />
      </UiProvider>,
    );
    expect(screen.getByRole('grid', { name: 'Unterhaltungen' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Neu' })).toBeVisible();
    rerender(
      <>
        <h2 id="inbox-title">Inbox</h2>
        <ChatList conversations={[]} aria-labelledby="inbox-title" />
      </>,
    );
    expect(screen.getByRole('grid', { name: 'Inbox' })).toBeVisible();
  });

  it('UIC-CHAT-LIST-1.1 UIC-CHAT-LIST-1.6 leaves the search out unless asked and the header without its parts', () => {
    const { container } = render(<ChatList conversations={conversations} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-chat-list__header')).toBeNull();
  });

  it('UIC-CHAT-LIST-1.2 UIC-CHAT-LIST-1.3 draws a title alone, an icon at the start, the status mark and the activity', () => {
    const { container } = render(
      <ChatList
        conversations={[
          { id: 'plain', title: 'Sourdough starter schedule' },
          { id: 'icon', title: 'Weekend hiking routes', icon: SparklesGlyph },
          {
            id: 'status',
            title: 'Repotting a fig tree',
            status: { icon: HistoryGlyph, label: 'Earlier versions' },
            activity: 'Working',
          },
        ]}
      />,
    );
    const plain = row('Sourdough starter schedule');
    expect(plain.querySelector('.ui-chat-list__avatar')).toBeNull();
    expect(plain.querySelector('.ui-avatar')).toBeNull();
    const icon = row('Weekend hiking routes');
    expect(icon.querySelector('.ui-chat-list__avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(icon.querySelector('.ui-chat-list__avatar [data-glyph]')).toHaveAttribute(
      'data-glyph',
      'sparkles',
    );
    const status = row('Repotting a fig tree, Earlier versions, Working');
    const mark = status.querySelector('.ui-chat-list__status');
    expect(mark).toHaveAccessibleName('Earlier versions');
    expect(mark?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'history');
    const activity = status.querySelector('.ui-chat-list__activity');
    expect(activity).toHaveAttribute('aria-hidden', 'true');
    expect(activity?.querySelectorAll('.ui-chat-list__activity-dot')).toHaveLength(3);
    expect(plain.querySelector('.ui-chat-list__activity')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-LIST', {
      slots: ['avatar', 'status', 'activity', 'activity-dot'],
    });
  });

  it('UIC-CHAT-LIST-1.12 shows a heading that names the list unless a label does', () => {
    const { container, rerender } = render(
      <ChatList conversations={conversations} heading="Recents" />,
    );
    expect(container.querySelector('.ui-chat-list__heading')).toHaveTextContent('Recents');
    expect(screen.getByRole('grid', { name: 'Recents' })).toBeVisible();
    expectHooksMatchSpec(container, 'CHAT-LIST', { slots: ['heading'] });
    rerender(<ChatList conversations={conversations} heading="Recents" aria-label="History" />);
    expect(screen.getByRole('grid', { name: 'History' })).toBeVisible();
  });

  it('UIC-CHAT-LIST-1.11 asks for more conversations from the Load more row', async () => {
    const user = userEvent.setup();
    let finish = () => {};
    const onLoadMore = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { container, rerender } = render(
      <ChatList conversations={conversations} onLoadMore={onLoadMore} />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-has-more', 'true');
    const button = screen.getByRole('button', { name: 'Load more' });
    expect(button).toHaveClass('ui-chat-list__load-more', 'ui-load-more');
    expect(button.parentElement).toHaveClass('ui-chat-list__body');
    await user.click(button);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(button).toHaveAttribute('data-pending', 'true'));
    await act(async () => finish());
    expect(button).not.toHaveAttribute('data-pending');
    expectHooksMatchSpec(container, 'CHAT-LIST', { slots: ['body', 'load-more'] });
    rerender(<ChatList conversations={conversations} onLoadMore={onLoadMore} isLoading />);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    rerender(<ChatList conversations={conversations} />);
    expect(root).not.toHaveAttribute('data-has-more');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-LIST-1.11 asks for the last rows to fade only with showEdgeFades', () => {
    const onLoadMore = vi.fn();
    const { container, rerender } = render(
      <ChatList conversations={conversations} onLoadMore={onLoadMore} />,
    );
    const root = container.firstElementChild;
    expect(root).not.toHaveAttribute('data-edge-fades');
    rerender(<ChatList conversations={conversations} onLoadMore={onLoadMore} showEdgeFades />);
    expect(root).toHaveAttribute('data-edge-fades', 'true');
    expectHooksMatchSpec(container, 'CHAT-LIST');
  });
});
