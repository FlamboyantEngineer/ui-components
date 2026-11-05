// Shared fixtures for the chat widget's unit tests: people, messages, and a chat that records the
// callbacks it receives.

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import { Chat, type ChatProps } from '../src/components/chat/chat.js';
import type {
  ChatMessageData,
  ChatPart,
  ChatParticipant,
} from '../src/components/chat-parts/chat-parts.js';

export const reader: ChatParticipant = { id: 'sam', name: 'Sam Reed', kind: 'person' };
export const ana: ChatParticipant = {
  id: 'ana',
  name: 'Ana Lopez',
  kind: 'person',
  status: 'active',
  statusLabel: 'Active',
};
export const ben: ChatParticipant = { id: 'ben', name: 'Ben Carter', kind: 'person' };
export const helper: ChatParticipant = { id: 'helper', name: 'Trip helper', kind: 'assistant' };

export const people = [reader, ana, ben];
export const assistantPeople = [reader, helper];

export const getNow = () => new Date('2026-04-20T10:30:00');

/** A message by `authorId` with one text part, written on 20 April unless `createdAt` says. */
export function message(
  id: string,
  authorId: string | undefined,
  fields: Partial<ChatMessageData> & { text?: string } = {},
): ChatMessageData {
  const { text = `Text of ${id}`, ...rest } = fields;
  const parts: ChatPart[] = [{ type: 'text', text }];
  return { id, authorId, createdAt: '2026-04-20T10:00:00', parts, ...rest };
}

export const conversation: ChatMessageData[] = [
  message('m1', 'ana', { text: 'Are we still on for Saturday?', createdAt: '2026-04-19T18:00:00' }),
  message('m2', 'sam', { text: 'Yes, 9 at the gate.', delivery: 'read' }),
  message('m3', 'ben', { text: 'I will bring **snacks**.', createdAt: '2026-04-20T10:10:00' }),
];

/** A chat between the fixture's people about the fixture's conversation, unless props say. */
export function TestChat(props: Partial<ChatProps>) {
  return (
    <Chat
      messages={conversation}
      participants={people}
      currentUserId="sam"
      getNow={getNow}
      {...props}
    />
  );
}

/**
 * Renders a chat (between people unless the props say), recording each callback; `rerenderWith`
 * renders it again with other props and the same callbacks.
 */
export function renderChat(props: Partial<ChatProps> = {}) {
  const user = userEvent.setup();
  const callbacks = {
    onSend: vi.fn(),
    onEdit: vi.fn(),
    onReply: vi.fn(),
    onReact: vi.fn(),
    onDelete: vi.fn(),
    onCopy: vi.fn(),
    onRetry: vi.fn(),
  };
  const view = render(<TestChat {...callbacks} {...props} />);
  const rerenderWith = (next: Partial<ChatProps>) =>
    view.rerender(<TestChat {...callbacks} {...next} />);
  return { ...view, user, rerenderWith, ...callbacks };
}

/** The message article with the DOM id `id`. */
export const article = (id: string) => document.getElementById(id) as HTMLElement;
