import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  TestChat,
  article,
  assistantPeople,
  message,
  renderChat,
} from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import type { ChatProps } from './chat.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const banner = (container: HTMLElement) => container.querySelector('.ui-chat__banner');

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

const assistantChat: ChatProps['messages'] = [
  message('q1', 'sam', { text: 'Which trains run on Sunday?' }),
  message('a1', 'helper', { text: 'The 9:15 and the 11:40.' }),
];

describe('Chat sending', () => {
  it('UIC-CHAT-2.4 UIC-CHAT-2.1 quotes messages in an assistant chat, named by the provider strings', async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    const { container } = render(
      <UiProvider
        strings={{ reply: 'Quote', chatReplyingTo: 'Quoting', chatCancelReply: 'Cancel quote' }}
      >
        <TestChat
          participants={assistantPeople}
          messages={assistantChat}
          onSend={vi.fn()}
          onReply={onReply}
        />
      </UiProvider>,
    );
    await user.hover(article('a1'));
    await user.click(within(article('a1')).getByRole('button', { name: 'Quote' }));
    expect(banner(container)).toHaveTextContent('Quoting');
    expect(box()).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(banner(container)).toBeNull();
    await user.hover(article('q1'));
    await user.click(within(article('q1')).getByRole('button', { name: 'Quote' }));
    await user.click(screen.getByRole('button', { name: 'Cancel quote' }));
    expect(banner(container)).toBeNull();
    await user.hover(article('a1'));
    await user.click(within(article('a1')).getByRole('button', { name: 'Quote' }));
    await user.keyboard('Is the later one direct?{Enter}');
    expect(onReply).toHaveBeenCalledWith('a1', 'Is the later one direct?', []);
    expect(banner(container)).toBeNull();
    expect(within(article('a1')).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-3.7 keeps the message and its quote when sending fails, and sends once on retry', async () => {
    const failure = new Error('Service unavailable');
    const onSendError = vi.fn();
    const onReply = vi
      .fn<NonNullable<ChatProps['onReply']>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(undefined);
    const { user, container } = renderChat({ onReply, onSendError });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await user.keyboard('See you there{Enter}');
    expect(onSendError).toHaveBeenCalledWith(failure);
    expect(box()).toHaveTextContent('See you there');
    expect(banner(container)).toHaveTextContent('Ana Lopez');
    await user.keyboard('{Enter}');
    expect(onReply).toHaveBeenCalledTimes(2);
    expect(onReply).toHaveBeenLastCalledWith('m1', 'See you there', []);
    expect(box()).toHaveTextContent('');
    expect(banner(container)).toBeNull();
  });

  it('UIC-CHAT-3.7 sends once while the host accepts, and settles in the conversation it came from', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const accepted = deferred();
    const onSend = vi.fn(() => accepted.promise);
    const chat = (conversationId: string) => (
      <UiProvider storage={storage}>
        <TestChat conversationId={conversationId} onSend={onSend} onReply={vi.fn()} />
      </UiProvider>
    );
    const { rerender, container } = render(chat('trip'));
    await user.click(box());
    await user.keyboard('Packed{Enter}{Enter}');
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.ui-chat__composer')).toHaveAttribute(
      'data-submitting',
      'true',
    );
    rerender(chat('other'));
    expect(box()).toHaveTextContent('');
    await user.click(box());
    await user.keyboard('Still deciding');
    await act(async () => accepted.resolve());
    expect(box()).toHaveTextContent('Still deciding');
    rerender(chat('trip'));
    expect(box()).toHaveTextContent('');
    rerender(chat('other'));
    expect(box()).toHaveTextContent('Still deciding');
  });

  it('UIC-CHAT-3.8 places the host’s tools before the model picker and forwards the composer options', async () => {
    const onSend = vi.fn();
    const { user, container, rerenderWith } = renderChat({
      participants: assistantPeople,
      messages: assistantChat,
      onSend,
      composerToolbar: (
        <label>
          <input type="checkbox" />
          Allow changes
        </label>
      ),
      modelPicker: {
        models: [{ id: 'fast', label: 'Fast' }],
        defaultModel: 'fast',
      },
      submitShortcut: 'Ctrl+Enter',
      allowsEmptySubmit: true,
    });
    const toolbar = container.querySelector('.ui-message-composer__toolbar') as HTMLElement;
    const checkbox = within(toolbar).getByRole('checkbox', { name: 'Allow changes' });
    const picker = within(toolbar).getByRole('button', { name: /Fast/ });
    expect(
      checkbox.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenLastCalledWith('', []);
    await user.click(box());
    await user.keyboard('First line{Enter}second line');
    expect(onSend).toHaveBeenCalledTimes(1);
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSend).toHaveBeenLastCalledWith('First line\nsecond line', []);
    rerenderWith({ participants: assistantPeople, messages: assistantChat, onSend });
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-disabled', 'true');
  });
});
