import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { createRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ChatMessageActionsMenu,
  type ChatMessageActionsMenuProps,
  type ChatMessageCommandProps,
} from './chat-message-actions.js';

type EmojiList = Awaited<ReturnType<NonNullable<ChatMessageCommandProps['loadEmoji']>>>;

const emojiList: EmojiList = [
  {
    unicode: '🎉',
    hexcode: '1F389',
    label: 'party popper',
    category: 'smileys',
    shortcodes: ['tada'],
    keywords: [],
  },
];
const loadEmoji = () => Promise.resolve(emojiList);

interface MessageProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement> | undefined;
  actions: ReactNode;
}

/** A message that takes the trigger's handlers and ref, with its action bar. */
function Message({ actions, children, ...rest }: MessageProps) {
  return (
    <article {...rest} tabIndex={0} aria-label="Ana: The museum opens at nine.">
      <p>The museum opens at nine.</p>
      {children}
      {actions}
    </article>
  );
}

function renderMenu(props: Omit<ChatMessageActionsMenuProps, 'children'>, extra?: ReactNode) {
  return render(
    <ChatMessageActionsMenu {...props}>
      {(actions) => <Message actions={actions}>{extra}</Message>}
    </ChatMessageActionsMenu>,
  );
}

const message = () => screen.getByRole('article');

function rightClick(user: UserEvent, target: Element) {
  return user.pointer({ keys: '[MouseRight]', target, coords: { clientX: 20, clientY: 20 } });
}

async function openMenu(user: UserEvent) {
  await rightClick(user, screen.getByText('The museum opens at nine.'));
  return screen.findByRole('menu', { name: 'Message actions' });
}

describe('ChatMessageActionsMenu', () => {
  it('UIC-CHAT-MESSAGE-ACTIONS-4.1 opens a menu of the commands on a secondary click on the message', async () => {
    const user = userEvent.setup();
    renderMenu({
      copyText: 'The museum opens at nine.',
      onFeedback: () => {},
      onReply: () => {},
      onReact: () => {},
      onEdit: () => {},
      onDelete: () => {},
      className: 'host-menu',
      id: 'message-menu',
      'data-menu-host': 'chat',
    });
    expect(within(message()).getByRole('toolbar', { name: 'Message actions' })).toBeVisible();
    const menu = await openMenu(user);
    expect(
      [...menu.querySelectorAll('[role^="menuitem"]')].map((item) => item.textContent),
    ).toEqual(['Copy', 'Good response', 'Bad response', 'Reply', 'Add reaction', 'Edit', 'Delete']);
    expect(within(menu).getByRole('group', { name: 'Feedback' })).toBeVisible();
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Good response' })).not.toBeChecked();
    const popover = document.querySelector('.ui-menu-popover');
    expect(popover).toHaveClass('host-menu');
    expect(popover).toHaveAttribute('id', 'message-menu');
    expect(popover).toHaveAttribute('data-menu-host', 'chat');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(message()).toHaveFocus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menu')).toBeVisible();
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-4.1 keeps the browser menu on a text control and without commands', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const ref = createRef<HTMLElement>();
    const { rerender } = render(
      <div onContextMenu={outer}>
        <ChatMessageActionsMenu onReply={() => {}}>
          {(actions) => (
            <article ref={ref} tabIndex={0}>
              <input aria-label="Draft" />
              {actions}
            </article>
          )}
        </ChatMessageActionsMenu>
      </div>,
    );
    expect(ref.current).toBe(message());
    await rightClick(user, screen.getByRole('textbox', { name: 'Draft' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(outer).toHaveBeenCalledTimes(1);
    const children = vi.fn((actions: ReactNode) => <Message actions={actions} />);
    rerender(
      <div onContextMenu={outer}>
        <ChatMessageActionsMenu>{children}</ChatMessageActionsMenu>
      </div>,
    );
    expect(children).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    await rightClick(user, message());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(outer).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-4.2 copies from the menu and the bar announces it', async () => {
    const user = userEvent.setup();
    renderMenu({ copyText: 'The museum opens at nine.' });
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitem', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('The museum opens at nine.');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copied'));
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-copied', 'true');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-4.2 rates from the menu, shares the rating with the bar and clears it', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    renderMenu({ onFeedback });
    let menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Bad response' }));
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'down', reasons: [] });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    menu = await openMenu(user);
    const down = within(menu).getByRole('menuitemcheckbox', { name: 'Bad response' });
    expect(down).toBeChecked();
    await user.click(down);
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: null, reasons: [] });
    expect(screen.getByRole('button', { name: 'Bad response' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-4.2 opens the feedback details against the message', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    renderMenu({ onFeedback, feedbackReasons: ['Accurate'] });
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Good response' }));
    const dialog = await screen.findByRole('dialog', { name: 'What went well?' });
    // The overlay hides the page from assistive technology while it is open.
    expect(document.querySelector('.ui-chat-message-actions')).toHaveAttribute('data-open', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Accurate' }));
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(onFeedback).toHaveBeenCalledWith({ rating: 'up', reasons: ['Accurate'] });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(message()).toHaveFocus());
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-4.2 reacts and deletes from the menu', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    const onDelete = vi.fn();
    const onReply = vi.fn();
    const onEdit = vi.fn();
    renderMenu({ onReact, onDelete, onReply, onEdit, loadEmoji, recentEmoji: ['🎉'] });
    let menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitem', { name: 'Reply' }));
    expect(onReply).toHaveBeenCalledTimes(1);
    menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitem', { name: 'Add reaction' }));
    await screen.findByRole('dialog', { name: 'Emoji picker' });
    // The overlay hides the page from assistive technology while it is open.
    expect(document.querySelector('.ui-chat-message-actions')).toHaveAttribute('data-open', 'true');
    expectHooksMatchSpec(document.body, 'CHAT-MESSAGE-ACTIONS', { slots: ['emoji-popover'] });
    await user.click(await screen.findByRole('row', { name: 'party popper' }));
    expect(onReact).toHaveBeenCalledWith('🎉');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(message()).toHaveFocus());
    menu = await openMenu(user);
    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete message?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(message()).toHaveFocus());
  });
});
