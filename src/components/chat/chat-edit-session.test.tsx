import { act, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { article, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const banner = () => document.querySelector('.ui-chat__banner');

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const messages = [message('m1', 'sam', { text: 'Draft' }), message('m2', 'ana', { text: 'Hi' })];

async function startEdit(user: ReturnType<typeof renderChat>['user']) {
  await user.hover(article('m1'));
  await user.click(within(article('m1')).getByRole('button', { name: 'Edit' }));
  await waitFor(() => expect(box()).toHaveFocus());
}

describe('Chat edit and reply sessions', () => {
  it('UIC-CHAT-2.5 keeps words added while a save waits, and ends an unchanged save', async () => {
    const first = deferred();
    const onEdit = vi.fn().mockReturnValueOnce(first.promise).mockReturnValue(undefined);
    const { user, rerenderWith } = renderChat({ messages, onEdit });
    await startEdit(user);
    await user.keyboard(' one{Enter}');
    expect(onEdit).toHaveBeenLastCalledWith('m1', 'Draft one', []);
    await user.keyboard(' and more');
    await act(async () => first.resolve());
    // The host applies the save it accepted.
    const saved = [message('m1', 'sam', { text: 'Draft one' }), ...messages.slice(1)];
    rerenderWith({ messages: saved, onEdit });
    expect(banner()).toHaveTextContent('Editing your message');
    expect(box()).toHaveTextContent('Draft one and more');
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenLastCalledWith('m1', 'Draft one and more', []);
    expect(banner()).toBeNull();
  });

  it('UIC-CHAT-2.5 keeps an edit started again while an earlier save of it waits', async () => {
    const first = deferred();
    const onEdit = vi.fn(() => first.promise);
    const { user } = renderChat({ messages, onEdit });
    await startEdit(user);
    await user.keyboard(' one{Enter}');
    await user.keyboard('{Escape}');
    expect(banner()).toBeNull();
    await startEdit(user);
    await user.keyboard(' second session');
    await act(async () => first.resolve());
    expect(banner()).toHaveTextContent('Editing your message');
    expect(box()).toHaveTextContent('Draft second session');
  });

  it('UIC-CHAT-2.5 keeps the edit after a refused save', async () => {
    const first = deferred();
    const onEdit = vi.fn(() => first.promise);
    const { user } = renderChat({ messages, onEdit, onSendError: () => undefined });
    await startEdit(user);
    await user.keyboard(' one{Enter}');
    await act(async () => first.reject(new Error('offline')));
    expect(banner()).toHaveTextContent('Editing your message');
    expect(box()).toHaveTextContent('Draft one');
  });

  it('UIC-CHAT-2.5 leaves an edit in another conversation to its own session', async () => {
    const first = deferred();
    const onEdit = vi.fn(() => first.promise);
    const { user, rerenderWith } = renderChat({ messages, onEdit, conversationId: 'a' });
    await startEdit(user);
    await user.keyboard(' one{Enter}');
    rerenderWith({ messages, onEdit, conversationId: 'b' });
    await startEdit(user);
    await act(async () => first.resolve());
    expect(banner()).toHaveTextContent('Editing your message');
    expect(box()).toHaveTextContent(/^Draft$/);
  });

  it('UIC-CHAT-2.5 keeps an edit reopened after leaving the conversation and coming back', async () => {
    for (const outcome of ['resolve', 'reject'] as const) {
      const first = deferred();
      const onEdit = vi.fn().mockReturnValueOnce(first.promise).mockReturnValue(undefined);
      const { user, rerenderWith, unmount } = renderChat({
        messages,
        onEdit,
        conversationId: 'a',
        onSendError: () => undefined,
      });
      await startEdit(user);
      await user.keyboard(' one{Enter}');
      rerenderWith({ messages, onEdit, conversationId: 'b', onSendError: () => undefined });
      rerenderWith({ messages, onEdit, conversationId: 'a', onSendError: () => undefined });
      await startEdit(user);
      // The same target and the same words, in a new edit session.
      await user.keyboard(' one');
      await act(async () =>
        outcome === 'resolve' ? first.resolve() : first.reject(new Error('offline')),
      );
      expect(banner()).toHaveTextContent('Editing your message');
      expect(box()).toHaveTextContent('Draft one');
      unmount();
    }
  });

  it('UIC-CHAT-2.4 keeps a reply reopened after leaving the conversation and coming back', async () => {
    const first = deferred();
    const onReply = vi.fn(() => first.promise);
    const { user, rerenderWith } = renderChat({ messages, onReply, conversationId: 'a' });
    const reply = async () => {
      await user.hover(article('m2'));
      await user.click(within(article('m2')).getByRole('button', { name: 'Reply' }));
      await waitFor(() => expect(box()).toHaveFocus());
    };
    await reply();
    await user.keyboard('Sure{Enter}');
    rerenderWith({ messages, onReply, conversationId: 'b' });
    rerenderWith({ messages, onReply, conversationId: 'a' });
    await reply();
    await user.keyboard('{Control>}a{/Control}Sure');
    await act(async () => first.resolve());
    expect(banner()).toHaveTextContent('Replying to');
    expect(box()).toHaveTextContent(/^Sure$/);
  });

  it('UIC-CHAT-2.4 keeps a reply whose words changed while it waited', async () => {
    const first = deferred();
    const onReply = vi.fn(() => first.promise);
    const { user } = renderChat({ messages, onReply });
    await user.hover(article('m2'));
    await user.click(within(article('m2')).getByRole('button', { name: 'Reply' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard('Sure{Enter}');
    await user.keyboard(' thing');
    await act(async () => first.resolve());
    expect(banner()).toHaveTextContent('Replying to');
    expect(box()).toHaveTextContent('Sure thing');
  });
});
