import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { article, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });

describe('Chat edit target', () => {
  it('UIC-CHAT-2.5 starts a new edit for another message with the same words', async () => {
    const first = message('m1', 'sam', { text: 'Same text' });
    const second = message('m2', 'sam', { text: 'Same text' });
    const { user, onEdit } = renderChat({ messages: [first, second] });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard(' for message one');
    expect(box()).toHaveTextContent('Same text for message one');
    await user.hover(article('m2'));
    await user.click(within(article('m2')).getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(box()).toHaveFocus());
    expect(box()).toHaveTextContent(/^Same text$/);
    await user.keyboard('!{Enter}');
    expect(onEdit).toHaveBeenCalledExactlyOnceWith('m2', 'Same text!', []);
  });

  it('UIC-CHAT-2.5 UIC-CHAT-3.4 starts a new edit when a queued message and a message share an id and words', async () => {
    const onQueueChange = vi.fn();
    const { user, onEdit } = renderChat({
      messages: [message('m1', 'sam', { text: 'Same text' })],
      queue: [{ id: 'm1', text: 'Same text' }],
      onQueueChange,
    });
    await user.click(screen.getByRole('button', { name: 'Actions for queued message 1' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit queued message 1' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard(' for the queue');
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(box()).toHaveFocus());
    expect(box()).toHaveTextContent(/^Same text$/);
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledExactlyOnceWith('m1', 'Same text', []);
    expect(onQueueChange).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-2.5 keeps the edit while the edited message changes otherwise', async () => {
    const own = message('m1', 'sam', { text: 'Same text' });
    const { user, rerenderWith, onEdit } = renderChat({ messages: [own] });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Edit' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard(' kept');
    rerenderWith({ messages: [{ ...own, createdAt: '2026-04-20T10:05:00' }] });
    expect(box()).toHaveTextContent('Same text kept');
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledExactlyOnceWith('m1', 'Same text kept', []);
  });
});
