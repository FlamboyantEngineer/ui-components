import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Menu, MenuItem } from '../menu/menu.js';
import { type ChatConversation, ChatList, type ChatListProps } from './chat-list.js';

const conversations: ChatConversation[] = [
  { id: 'ana', title: 'Ana Lima', lastMessage: 'The museum opens at nine.' },
  { id: 'trip', title: 'Lisbon trip', lastMessage: 'I booked the table.' },
  { id: 'notes', title: 'Notes to self' },
];

const row = (name: RegExp) => screen.getByRole('row', { name });

function List({
  onMenuAction,
  ...props
}: Partial<ChatListProps> & { onMenuAction?: (action: string) => void }) {
  return (
    <ChatList
      conversations={conversations}
      renderContextMenu={(conversation) =>
        conversation.id === 'notes' ? null : (
          <Menu onAction={(key) => onMenuAction?.(`${String(key)}:${conversation.id}`)}>
            <MenuItem id="rename">Rename {conversation.title}</MenuItem>
            <MenuItem id="delete">Delete</MenuItem>
          </Menu>
        )
      }
      {...props}
    />
  );
}

afterEach(() => vi.useRealTimers());

describe('ChatList context menus', () => {
  it('UIC-CHAT-LIST-2.1 opens a row menu on secondary click, named for the conversation, and returns focus to the row', async () => {
    const user = userEvent.setup();
    const onMenuAction = vi.fn();
    const onSelectionChange = vi.fn();
    render(<List onMenuAction={onMenuAction} onSelectionChange={onSelectionChange} />);
    const trip = row(/Lisbon trip/);
    await user.pointer({ keys: '[MouseRight]', target: trip });
    const menu = await screen.findByRole('menu', { name: 'Actions for Lisbon trip' });
    expect(within(menu).getByRole('menuitem', { name: 'Rename Lisbon trip' })).toBeInTheDocument();
    expect(trip).toHaveAttribute('data-menu-open', 'true');
    expectHooksMatchSpec(document.body, 'CHAT-LIST', { slots: ['conversation'] });
    await waitFor(() => expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus());
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onMenuAction).toHaveBeenCalledWith('delete:trip');
    expect(onMenuAction).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    await waitFor(() => expect(trip).toHaveFocus());
    expect(trip).not.toHaveAttribute('data-menu-open');
    expect(trip).not.toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-CHAT-LIST-2.1 opens from the Context Menu key and Shift+F10 on the focused row', async () => {
    const user = userEvent.setup();
    render(<List />);
    await user.tab();
    const ana = row(/Ana Lima/);
    expect(ana).toHaveFocus();
    await user.keyboard('{ContextMenu}');
    expect(await screen.findByRole('menu', { name: 'Actions for Ana Lima' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(ana).toHaveFocus());
    await user.keyboard('{ArrowDown}');
    const trip = row(/Lisbon trip/);
    expect(trip).toHaveFocus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(
      await screen.findByRole('menu', { name: 'Actions for Lisbon trip' }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trip).toHaveFocus());
  });

  it('UIC-CHAT-LIST-2.1 opens at a resting touch', async () => {
    vi.useFakeTimers();
    render(<List />);
    const ana = row(/Ana Lima/);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot hold a touch at rest
    fireEvent.pointerDown(ana, { pointerType: 'touch', pointerId: 3, clientX: 20, clientY: 20 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    vi.useRealTimers();
    expect(await screen.findByRole('menu', { name: 'Actions for Ana Lima' })).toBeInTheDocument();
  });

  it('UIC-CHAT-LIST-2.2 leaves the browser menu to rows without one, and to every row without renderContextMenu', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<List />);
    await user.pointer({ keys: '[MouseRight]', target: row(/Notes to self/) });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(fireEvent.contextMenu(row(/Notes to self/))).toBe(true);
    rerender(<List renderContextMenu={undefined} />);
    expect(fireEvent.contextMenu(row(/Ana Lima/))).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-LIST-2.2 closes the menu of a conversation that leaves the list', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<List />);
    await user.pointer({ keys: '[MouseRight]', target: row(/Ana Lima/) });
    expect(await screen.findByRole('menu', { name: 'Actions for Ana Lima' })).toBeInTheDocument();
    rerender(<List conversations={conversations.slice(1)} />);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
