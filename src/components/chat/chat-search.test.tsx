import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { article, message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

const notes = [
  message('s1', 'ana', { text: 'Meet at the café', createdAt: '2026-04-20T09:00:00' }),
  message('s2', 'ben', { text: 'Which cafe?', createdAt: '2026-04-20T09:10:00' }),
  message('s3', 'sam', { text: 'The one by the river' }),
  message('s4', 'ana', { text: 'The cafe by the river', createdAt: '2026-04-20T10:20:00' }),
];

const findBox = () => screen.getByRole('searchbox', { name: 'Search this conversation' });

describe('Chat search', () => {
  it('UIC-CHAT-5.3 opens a find bar, highlights the newest match and keeps focus in the box', async () => {
    const { user, container } = renderChat({ messages: notes, showSearch: true });
    const toggle = screen.getByRole('button', { name: 'Search this conversation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute(
      'aria-controls',
      container.querySelector('.ui-chat__search')?.id,
    );
    await waitFor(() => expect(findBox()).toHaveFocus());
    await user.keyboard('CAFE');
    expect(container.querySelector('.ui-find-bar__status')).toHaveTextContent('3 of 3');
    expect(article('s4')).toHaveAttribute('data-highlighted', 'true');
    expect(article('s1').querySelector('mark')).toHaveTextContent('café');
    expect(findBox()).toHaveFocus();
  });

  it('UIC-CHAT-5.3 steps through the matches with Enter and Shift+Enter, wrapping around', async () => {
    const { user, container } = renderChat({ messages: notes, showSearch: true });
    await user.click(screen.getByRole('button', { name: 'Search this conversation' }));
    await waitFor(() => expect(findBox()).toHaveFocus());
    await user.keyboard('river');
    const status = container.querySelector('.ui-find-bar__status');
    expect(status).toHaveTextContent('2 of 2');
    await user.keyboard('{Enter}');
    expect(status).toHaveTextContent('1 of 2');
    expect(article('s3')).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(article('s4')).toHaveAttribute('data-highlighted', 'true');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(article('s3')).toHaveAttribute('data-highlighted', 'true');
  });

  it('UIC-CHAT-5.3 closes onto the current match, or the search button without one', async () => {
    const { user, container } = renderChat({ messages: notes, showSearch: true });
    const toggle = screen.getByRole('button', { name: 'Search this conversation' });
    await user.click(toggle);
    await waitFor(() => expect(findBox()).toHaveFocus());
    await user.keyboard('which{Escape}');
    expect(container.querySelector('.ui-chat__search')).toBeNull();
    expect(article('s2')).toHaveFocus();
    expect(article('s2')).not.toHaveAttribute('data-highlighted');
    expect(article('s2').querySelector('mark')).toBeNull();
    await user.click(toggle);
    await waitFor(() => expect(findBox()).toHaveFocus());
    await user.keyboard('lighthouse');
    expect(container.querySelector('.ui-find-bar__status')).toHaveTextContent('No results');
    await user.click(toggle);
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
