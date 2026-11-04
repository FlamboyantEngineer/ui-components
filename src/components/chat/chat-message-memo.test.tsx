import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { article, assistantPeople, renderChat } from '../../../test/chat-fixtures.js';
import type { ChatCustomPart, ChatMessageData } from '../chat-parts/chat-parts.js';
import type { ChatProps } from './chat.js';

/** A complete reply by the helper whose only part is a custom card, unless `fields` say. */
function reply(id: string, fields: Partial<ChatMessageData> = {}): ChatMessageData {
  return {
    id,
    authorId: 'helper',
    createdAt: '2026-04-20T10:01:00',
    status: 'complete',
    parts: [{ type: 'custom', id: `${id}-card`, name: 'card' }],
    ...fields,
  };
}

const saved = reply('saved', {
  parts: [
    { type: 'custom', id: 'saved-card', name: 'card' },
    {
      type: 'tool-call',
      id: 'book',
      name: 'book_table',
      label: 'Book a table',
      status: 'approval-requested',
      approval: { scopeLabel: 'this trip' },
    },
  ],
});
const streaming = (text: string) =>
  reply('live', {
    status: 'streaming',
    parts: [
      { type: 'custom', id: 'live-card', name: 'card' },
      { type: 'text', text, status: 'streaming' },
    ],
  });

/**
 * The options a host writes inline, created afresh on every call as a host's render does: each
 * custom part it draws is recorded in `drawn`, labelled by `version`.
 */
function inlineOptions(drawn: string[], version: string, icon?: ReactNode): Partial<ChatProps> {
  return {
    participants: assistantPeople,
    currentUserId: 'sam',
    getNow: () => new Date('2026-04-20T10:30:00'),
    renderPart: (part: ChatCustomPart) => {
      drawn.push(part.id ?? '');
      return `${part.id ?? ''} ${version}`;
    },
    toolRenderers: { book_table: { render: () => `Booking ${version}`, replaces: 'body' } },
    onApprove: (id: string) => drawn.push(`approve ${id} ${version}`),
    onDeny: () => undefined,
    onAnswerQuestion: () => undefined,
    getReference: () => undefined,
    feedbackReasons: ['Too long'],
    thinkingIcon: icon ?? (
      <svg viewBox="0 0 8 8">
        <path d="M0 0h8" />
      </svg>
    ),
  };
}

describe('Chat message memoisation (UIC-CHAT-1.5)', () => {
  it('keeps unchanged messages from rendering again when inline options are recreated', () => {
    const drawn: string[] = [];
    const messages = [saved, streaming('Saturday')];
    const { rerenderWith } = renderChat({ ...inlineOptions(drawn, 'v1'), messages });
    expect(drawn).toContain('saved-card');
    drawn.length = 0;

    rerenderWith({ ...inlineOptions(drawn, 'v2'), messages });
    expect(drawn).toEqual([]);

    rerenderWith({ ...inlineOptions(drawn, 'v3'), messages: [saved, streaming('Saturday at')] });
    expect(drawn).toEqual(['live-card']);
    expect(article('live')).toHaveTextContent('live-card v3');
    expect(article('saved')).toHaveTextContent('saved-card v1');
    expect(article('saved')).toHaveTextContent('Booking v1');
  });

  it('calls the latest callback of a message that did not render again', async () => {
    const drawn: string[] = [];
    const messages = [saved];
    const { rerenderWith, user } = renderChat({ ...inlineOptions(drawn, 'v1'), messages });
    rerenderWith({ ...inlineOptions(drawn, 'v2'), messages });
    drawn.length = 0;
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(drawn).toEqual(['approve book v2']);
  });

  it('draws the latest options in a message that renders again', () => {
    const drawn: string[] = [];
    const { rerenderWith } = renderChat({ ...inlineOptions(drawn, 'v1'), messages: [saved] });
    rerenderWith({
      ...inlineOptions(drawn, 'v2'),
      messages: [{ ...saved, isEdited: true }],
    });
    expect(article('saved')).toHaveTextContent('saved-card v2');
    expect(article('saved')).toHaveTextContent('Booking v2');
  });

  it('shows options as they come and go', () => {
    const drawn: string[] = [];
    const messages = [saved];
    const { rerenderWith } = renderChat({ ...inlineOptions(drawn, 'v1'), messages });
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    const { onApprove: _approve, ...withoutApprove } = inlineOptions(drawn, 'v2');
    rerenderWith({ ...withoutApprove, messages });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('draws every message again when a render option comes or goes', () => {
    const drawn: string[] = [];
    const messages = [saved];
    const { rerenderWith } = renderChat({ ...inlineOptions(drawn, 'v1'), messages });
    expect(article('saved')).toHaveTextContent('Booking v1');
    const { toolRenderers: _tools, ...withoutTools } = inlineOptions(drawn, 'v2');
    rerenderWith({ ...withoutTools, messages });
    expect(article('saved')).not.toHaveTextContent('Booking');
    expect(article('saved')).toHaveTextContent('saved-card v2');
  });

  it('draws a thinking icon that changes, and keeps one that draws the same', () => {
    const drawn: string[] = [];
    const messages = [saved, reply('wait', { status: 'streaming', parts: [] })];
    const { container, rerenderWith } = renderChat({ ...inlineOptions(drawn, 'v1'), messages });
    drawn.length = 0;
    rerenderWith({ ...inlineOptions(drawn, 'v2'), messages });
    expect(drawn).toEqual([]);

    const dot = (
      <svg viewBox="0 0 8 8">
        <circle r="4" />
      </svg>
    );
    rerenderWith({ ...inlineOptions(drawn, 'v3', dot), messages });
    expect(container.querySelector('circle')).toBeInTheDocument();
    expect(container.querySelector('path[d="M0 0h8"]')).not.toBeInTheDocument();
  });
});
