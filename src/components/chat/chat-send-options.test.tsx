import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TestChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { MessageComposerMenuButton } from '../message-composer/index.js';
import type { ChatProps } from './chat.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const plus = () => screen.queryAllByRole('button', { name: 'Add and more' });

function renderOptions(props: Partial<ChatProps>, storage = createMemoryStorage()) {
  const user = userEvent.setup();
  const callbacks = { onSend: vi.fn(), onSendNow: vi.fn(), onQueueChange: vi.fn() };
  const view = render(
    <UiProvider storage={storage}>
      <TestChat {...callbacks} {...props} />
    </UiProvider>,
  );
  return { ...view, ...callbacks, user, storage };
}

describe('Chat sending options', () => {
  it('UIC-CHAT-3.14 offers no sending options unless asked', () => {
    renderOptions({});
    expect(plus()).toHaveLength(0);
  });

  it('UIC-CHAT-3.14 UIC-MESSAGE-COMPOSER-5.6 adds a "+" menu with the sending options when the host has none', async () => {
    const { user } = renderOptions({ showSendOptions: true });
    expect(plus()).toHaveLength(1);
    await user.click(plus()[0] as HTMLElement);
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('group', { name: 'Sending' })).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitemcheckbox', { name: /^Steer automatically/ }),
    ).not.toBeChecked();
    expect(within(menu).getByRole('menuitemcheckbox', { name: /^Send with/ })).not.toBeChecked();
  });

  it('UIC-CHAT-3.14 always offers steering, with no reply running and without onSendNow', async () => {
    const { user, onSend } = renderOptions({
      showSendOptions: true,
      isPending: true,
      onSendNow: undefined,
    });
    await user.click(plus()[0] as HTMLElement);
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }));
    expect(screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ })).toBeChecked();
    expect(screen.getByRole('menuitemcheckbox', { name: /^Send with/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(box());
    await user.keyboard('Later');
    await user.keyboard('{Enter}');
    // Without onSendNow the choice is kept but the message queues as before.
    expect(onSend).toHaveBeenCalledWith('Later', []);
  });

  it('UIC-CHAT-3.14 offers steering while no reply runs', async () => {
    const { user } = renderOptions({ showSendOptions: true, isPending: false });
    await user.click(plus()[0] as HTMLElement);
    expect(
      screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }),
    ).toBeInTheDocument();
  });

  it('UIC-CHAT-3.14 UIC-MESSAGE-COMPOSER-5.6 joins the host\'s own "+" menu after its sections', async () => {
    const { user } = renderOptions({
      showSendOptions: true,
      composerStartControls: (
        <MessageComposerMenuButton
          sections={[{ id: 'add', title: 'Add', items: [{ id: 'photo', label: 'Photo' }] }]}
        />
      ),
    });
    expect(plus()).toHaveLength(1);
    await user.click(plus()[0] as HTMLElement);
    const groups = within(screen.getByRole('menu')).getAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-label') ?? group.textContent)).toEqual([
      expect.stringMatching(/Add/),
      expect.stringMatching(/Sending/),
    ]);
  });

  it('UIC-CHAT-3.14 steers a message written during a reply, with Enter, Ctrl+Enter and Send, once chosen', async () => {
    const storage = createMemoryStorage();
    const { user, onSend, onSendNow, unmount } = renderOptions(
      { showSendOptions: true, isPending: true },
      storage,
    );
    await user.click(plus()[0] as HTMLElement);
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }));
    expect(screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ })).toBeChecked();
    await user.keyboard('{Escape}');
    await user.click(box());
    await user.keyboard('Turn left');
    await user.keyboard('{Enter}');
    expect(onSendNow).toHaveBeenCalledWith('Turn left', [], undefined);
    expect(onSend).not.toHaveBeenCalled();
    await user.keyboard('Turn right');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSendNow).toHaveBeenLastCalledWith('Turn right', [], undefined);
    unmount();
    // The choice is stored, so the next chat starts with it.
    const view = renderOptions({ isPending: true }, storage);
    await view.user.click(box());
    await view.user.keyboard('Go on');
    await view.user.click(screen.getByRole('button', { name: 'Send' }));
    expect(view.onSendNow).toHaveBeenCalledWith('Go on', [], undefined);
    expect(view.onSend).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-3.14 sends as usual while no reply runs, even when steering', async () => {
    const { user, onSend, onSendNow } = renderOptions({ steersWhilePending: true });
    await user.click(box());
    await user.keyboard('Hello');
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello', []);
    expect(onSendNow).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-3.14 calls back on a controlled option without changing it', async () => {
    const onSteersWhilePendingChange = vi.fn();
    const { user } = renderOptions({
      showSendOptions: true,
      steersWhilePending: false,
      onSteersWhilePendingChange,
    });
    await user.click(plus()[0] as HTMLElement);
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }));
    expect(onSteersWhilePendingChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }),
    ).not.toBeChecked();
  });

  it('UIC-CHAT-3.14 sends with Ctrl+Enter only once chosen, Enter breaking the line', async () => {
    const { user, onSend } = renderOptions({ defaultSendsWithModifier: true });
    await user.click(box());
    await user.keyboard('Line one');
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
    await user.keyboard('Line two');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend.mock.calls[0]?.[0]).toMatch(/Line one[\s\S]+Line two/);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+Enter',
    );
  });
});
