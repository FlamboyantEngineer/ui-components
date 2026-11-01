import { describe, expect, it } from 'vitest';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import {
  createOutgoingMessage,
  findAwaitingMessage,
  isAwaitingReader,
  listPrompts,
  recordResponse,
  toDismissal,
  type ChatReaderResponse,
} from './chat-reply.js';

const reply: ChatMessageData = {
  id: 'reply',
  authorId: 'helper',
  createdAt: '2026-04-20T10:00:00.000Z',
  parts: [
    {
      type: 'tool-call',
      id: 'call',
      name: 'delete_draft',
      status: 'approval-requested',
      approval: { scopeLabel: 'this chat' },
    },
    { type: 'question', id: 'card', questions: [], status: 'pending' },
    {
      type: 'tool-call',
      id: 'done',
      name: 'delete_draft',
      status: 'approval-requested',
      approval: { decision: 'approved' },
    },
  ],
};

describe('Reader responses', () => {
  it('UIC-CHAT-CONTROLLER-3.2 records a response only on a part that waits and fits it', () => {
    const answers = [{ questionId: 'q', optionIds: ['a'] }];
    const question = { type: 'question', status: 'answered', answers } as const;
    expect(recordResponse(reply, 'call', question).parts[0]).toBe(reply.parts[0]);
    expect(recordResponse(reply, 'card', question).parts[1]).toMatchObject({
      status: 'answered',
      answers,
    });
    const denial = { type: 'approval', decision: 'denied', reason: 'No' } as const;
    expect(recordResponse(reply, 'card', denial).parts[1]).toBe(reply.parts[1]);
    expect(recordResponse(reply, 'done', denial).parts[2]).toBe(reply.parts[2]);
    expect(recordResponse(reply, 'call', denial).parts[0]).toMatchObject({
      status: 'denied',
      approval: { scopeLabel: 'this chat', decision: 'denied', reason: 'No' },
    });
  });

  it('UIC-CHAT-CONTROLLER-3.5 tells the parts that wait for the reader', () => {
    expect(reply.parts.map(isAwaitingReader)).toEqual([true, true, false]);
    expect(isAwaitingReader({ type: 'question', id: 'q', questions: [], status: 'answered' })).toBe(
      false,
    );
    expect(isAwaitingReader({ type: 'text', text: 'Hi' })).toBe(false);
  });

  it('UIC-CHAT-CONTROLLER-3.4 dismisses a question and denies an approval', () => {
    expect(reply.parts.map(toDismissal).slice(0, 2)).toEqual([
      { type: 'approval', decision: 'denied' },
      { type: 'question', status: 'dismissed', answers: [] },
    ]);
    const dismissal: ChatReaderResponse = { type: 'question', status: 'dismissed', answers: [] };
    expect(findAwaitingMessage([reply], 'card', dismissal)).toBe(0);
    expect(findAwaitingMessage([reply], 'done', dismissal)).toBe(-1);
  });

  it('UIC-CHAT-CONTROLLER-2.6 builds the reader message and lists their prompts', () => {
    const author = { authorId: 'ana', createdAt: '2026-04-20T10:00:00.000Z' };
    const files = [{ id: 'f', name: 'soup.png', mediaType: 'image/png' }];
    const sent = createOutgoingMessage({ id: 'm', text: 'Like this?', attachments: files }, author);
    expect(sent).toEqual({
      id: 'm',
      ...author,
      parts: [
        { type: 'files', attachments: files },
        { type: 'text', text: 'Like this?' },
      ],
    });
    const twoParts: ChatMessageData = {
      ...sent,
      id: 'm2',
      parts: [
        { type: 'text', text: 'First line' },
        { type: 'text', text: 'Second line' },
      ],
    };
    expect(listPrompts([sent, reply, twoParts], 'ana')).toEqual([
      'Like this?',
      'First line\n\nSecond line',
    ]);
  });
});
