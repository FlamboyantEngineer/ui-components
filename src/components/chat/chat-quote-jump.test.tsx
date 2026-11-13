import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { article, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Chat quote jump', () => {
  it('UIC-CHAT-2.4 UIC-CHAT-5.3 marks the quoted message for two seconds, so its quote jumps there again', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const reply = message('m4', 'ana', { text: 'Gate B', replyTo: 'm2' });
    renderChat({ messages: [message('m2', 'sam'), reply], showSearch: true });
    const quote = within(article('m4')).getByRole('button', { name: /^Quote from Sam Reed/ });
    await user.click(quote);
    expect(article('m2')).toHaveAttribute('data-highlighted', 'true');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(article('m2')).not.toHaveAttribute('data-highlighted');
    // A search that ends does not fall back to the message the quote jumped to.
    await user.click(screen.getByRole('button', { name: 'Search this conversation' }));
    await user.keyboard('gate');
    expect(article('m4')).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Escape}');
    expect(article('m2')).not.toHaveAttribute('data-highlighted');
    await user.click(quote);
    expect(article('m2')).toHaveAttribute('data-highlighted', 'true');
    await waitFor(() => expect(article('m2')).toHaveFocus());
  });
});
