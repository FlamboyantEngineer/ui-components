import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { article, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const banner = () => document.querySelector('.ui-chat__banner');

const quoted = message('m1', 'ana', { text: 'Lunch at noon?' });
const other = message('m2', 'ana', { text: 'Or later' });

describe('Chat reply target', () => {
  it.each([
    ['removed', [other]],
    ['deleted', [{ ...quoted, isDeleted: true }, other]],
  ])(
    'UIC-CHAT-2.4 ends a reply whose message is %s, keeps the text and sends it as a new message',
    async (_, without) => {
      const { user, rerenderWith, onReply, onSend } = renderChat({ messages: [quoted, other] });
      await user.hover(article('m1'));
      await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
      await waitFor(() => expect(box()).toHaveFocus());
      await user.keyboard('Reply text');
      expect(banner()).toHaveTextContent('Replying to');
      rerenderWith({ messages: without, onReply, onSend });
      expect(banner()).toBeNull();
      expect(box()).toHaveTextContent('Reply text');
      await user.click(box());
      await user.keyboard('{Enter}');
      expect(onReply).not.toHaveBeenCalled();
      expect(onSend).toHaveBeenCalledExactlyOnceWith('Reply text', []);
    },
  );

  it('UIC-CHAT-2.4 does not bring back a reply whose message returns', async () => {
    const { user, rerenderWith, onReply, onSend } = renderChat({ messages: [quoted, other] });
    await user.hover(article('m1'));
    await user.click(within(article('m1')).getByRole('button', { name: 'Reply' }));
    await waitFor(() => expect(box()).toHaveFocus());
    await user.keyboard('Reply text');
    rerenderWith({ messages: [other], onReply, onSend });
    rerenderWith({ messages: [quoted, other], onReply, onSend });
    expect(banner()).toBeNull();
    await user.click(box());
    await user.keyboard('{Enter}');
    expect(onReply).not.toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledExactlyOnceWith('Reply text', []);
  });
});
