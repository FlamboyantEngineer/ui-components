import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { article, assistantPeople, message, renderChat } from '../../../test/chat-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';

installEditorDom();

const assistantConversation = [
  message('q1', 'sam', { text: 'Where should we stop for lunch?' }),
  message('a1', 'helper', { text: 'The lakeside cafe opens at noon.' }),
  message('n1', undefined, { text: 'Trip helper joined.' }),
];

const assistantChat = {
  messages: assistantConversation,
  participants: assistantPeople,
  currentUserId: 'sam',
};

describe('Chat message display', () => {
  it('UIC-CHAT-1.8 shows avatars, names and bubbles by default', () => {
    const { container } = renderChat(assistantChat);
    for (const id of ['q1', 'a1']) {
      expect(article(id).querySelector('.ui-chat-message__avatar')).not.toBeNull();
      expect(article(id).querySelector('.ui-chat-message__author')).not.toBeNull();
      expect(article(id)).toHaveAttribute('data-variant', 'bubble');
      expect(article(id)).not.toHaveAttribute('data-avatar-hidden');
    }
    expectHooksMatchSpec(container, 'CHAT');
  });

  it('UIC-CHAT-1.8 hides every avatar and name and keeps each message named by its author', () => {
    const { container } = renderChat({
      ...assistantChat,
      showAvatars: false,
      showAuthorNames: false,
    });
    expect(container.querySelector('.ui-chat-message__avatar')).toBeNull();
    expect(container.querySelector('.ui-chat-message__author')).toBeNull();
    expect(article('q1')).toHaveAttribute('data-avatar-hidden', 'true');
    expect(screen.getByRole('article', { name: /^Trip helper, / })).toBe(article('a1'));
    expect(screen.getByRole('article', { name: /^Sam Reed, / })).toBe(article('q1'));
    expectHooksMatchSpec(container, 'CHAT');
  });

  it('UIC-CHAT-1.8 draws each side in its own variant and leaves notices at the default', () => {
    const { rerenderWith } = renderChat({ ...assistantChat, receivedVariant: 'plain' });
    expect(article('q1')).toHaveAttribute('data-variant', 'bubble');
    expect(article('a1')).toHaveAttribute('data-variant', 'plain');
    expect(article('n1')).toHaveAttribute('data-variant', 'bubble');
    rerenderWith({ ...assistantChat, sentVariant: 'plain', receivedVariant: 'bubble' });
    expect(article('q1')).toHaveAttribute('data-variant', 'plain');
    expect(article('a1')).toHaveAttribute('data-variant', 'bubble');
  });
});
