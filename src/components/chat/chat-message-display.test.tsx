import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { article, assistantPeople, message, renderChat } from '../../../test/chat-fixtures.js';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
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
      expect(article(id).querySelector('.ui-chat-message__time')).not.toBeNull();
      expect(article(id)).toHaveAttribute('data-variant', 'bubble');
      expect(article(id)).not.toHaveAttribute('data-avatar-hidden');
    }
    expectHooksMatchSpec(container, 'CHAT');
  });

  it('UIC-CHAT-1.8 hides every avatar, name and time and keeps each message named by its author', () => {
    const { container } = renderChat({
      ...assistantChat,
      showAvatars: false,
      showAuthorNames: false,
      timePlacement: 'none',
    });
    expect(container.querySelector('.ui-chat-message__avatar')).toBeNull();
    expect(container.querySelector('.ui-chat-message__author')).toBeNull();
    expect(container.querySelector('.ui-chat-message__header')).toBeNull();
    expect(container.querySelector('.ui-chat-date-separator')).not.toBeNull();
    expect(article('q1')).toHaveAttribute('data-avatar-hidden', 'true');
    expect(screen.getByRole('article', { name: /^Trip helper, / })).toBe(article('a1'));
    expect(screen.getByRole('article', { name: /^Sam Reed, / })).toBe(article('q1'));
    expectHooksMatchSpec(container, 'CHAT');
  });

  it('UIC-CHAT-1.8 places every time in the footer, under the message', () => {
    const { container } = renderChat({ ...assistantChat, timePlacement: 'footer' });
    for (const id of ['q1', 'a1']) {
      expect(
        article(id).querySelector('.ui-chat-message__footer .ui-chat-message__time'),
      ).not.toBeNull();
      expect(
        article(id).querySelector('.ui-chat-message__header .ui-chat-message__time'),
      ).toBeNull();
      expect(article(id).querySelector('.ui-chat-message__author')).not.toBeNull();
    }
    expectHooksMatchSpec(container, 'CHAT');
  });

  it('UIC-CHAT-1.8 places the time of a message without written text on its own, and collapses footer times on request', () => {
    const source = { id: 's1', title: 'Cafe guide', url: 'https://example.com/cafes' };
    const messages = [
      ...assistantConversation,
      message('t1', 'helper', {
        parts: [{ type: 'tool-call', id: 'c1', name: 'search_cafes', status: 'succeeded' }],
      }),
      message('m1', 'helper', {
        parts: [
          { type: 'reasoning', id: 'r1', text: 'Cafes first.', status: 'complete' },
          { type: 'tool-call', id: 'c2', name: 'search_cafes', status: 'failed' },
          { type: 'plan', id: 'p1', steps: [{ id: 'st1', label: 'Find a cafe', status: 'done' }] },
        ],
      }),
      message('s1', 'helper', { parts: [{ type: 'sources', sources: [source] }] }),
      message('e1', 'helper', { status: 'streaming', parts: [{ type: 'text', text: ' ' }] }),
      message('w1', 'helper', {
        parts: [
          { type: 'text', text: 'The cafe guide lists three [1].' },
          { type: 'sources', sources: [source] },
        ],
      }),
    ];
    const { rerenderWith } = renderChat({
      ...assistantChat,
      messages,
      timePlacement: 'footer',
      activityTimePlacement: 'none',
    });
    for (const id of ['a1', 'q1', 'w1']) {
      expect(
        article(id).querySelectorAll('.ui-chat-message__footer .ui-chat-message__time'),
      ).toHaveLength(1);
    }
    expect(article('w1').querySelectorAll('.ui-chat-message__time')).toHaveLength(1);
    for (const id of ['t1', 'm1', 's1', 'e1']) {
      expect(article(id).querySelector('.ui-chat-message__time')).toBeNull();
      expect(article(id)).toHaveAccessibleName(/^Trip helper, .*\d/);
    }
    expect(article('a1')).not.toHaveAttribute('data-collapse-footer-time');
    rerenderWith({ ...assistantChat, messages, timePlacement: 'footer', collapseFooterTime: true });
    expect(
      article('t1').querySelector('.ui-chat-message__footer .ui-chat-message__time'),
    ).not.toBeNull();
    expect(article('t1')).toHaveAttribute('data-collapse-footer-time', 'true');
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

describe('Chat streaming caret', () => {
  const reply = (parts: ChatPart[], fields: Partial<ChatMessageData> = {}) =>
    ({
      id: 'a2',
      authorId: 'helper',
      createdAt: '2026-04-20T10:00:05',
      parts,
      ...fields,
    }) as ChatMessageData;
  const caret = () => article('a2').hasAttribute('data-streaming-caret');
  const streaming = { status: 'streaming' } as const;
  const text: ChatPart = { type: 'text', text: 'The lakeside cafe', status: 'streaming' };
  const tool: ChatPart = {
    type: 'tool-call',
    id: 'search',
    name: 'search',
    label: 'Searching',
    status: 'running',
  };
  const reasoning: ChatPart = { type: 'reasoning', id: 'why', text: 'Lunch', status: 'streaming' };

  it('UIC-CHAT-1.8 shows no caret by default while a reply streams', () => {
    renderChat({
      ...assistantChat,
      messages: [...assistantConversation, reply([text], streaming)],
    });
    expect(caret()).toBe(false);
    expect(article('a2')).toHaveAttribute('aria-busy', 'true');
  });

  it('UIC-CHAT-1.8 shows the caret only while text streams in when asked', () => {
    const { rerenderWith } = renderChat({
      ...assistantChat,
      streamingCaret: true,
      messages: [...assistantConversation, reply([text], streaming)],
    });
    expect(caret()).toBe(true);
    const cases: Array<[ChatPart[], Partial<ChatMessageData>]> = [
      [[], streaming],
      [[reasoning], streaming],
      [[text, tool], streaming],
      [[text], { ...streaming, statusText: 'Checking the menu…' }],
      [[{ ...text, text: '  ' }], streaming],
      [[text], { status: 'complete' }],
      [[text], { status: 'cancelled' }],
    ];
    for (const [parts, fields] of cases) {
      rerenderWith({
        ...assistantChat,
        streamingCaret: true,
        messages: [...assistantConversation, reply(parts, fields)],
      });
      expect(caret()).toBe(false);
    }
    rerenderWith({
      ...assistantChat,
      streamingCaret: true,
      thinkingUntil: 'end',
      messages: [...assistantConversation, reply([text], streaming)],
    });
    expect(caret()).toBe(false);
  });
});
