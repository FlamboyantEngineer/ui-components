import { act, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  article,
  assistantPeople,
  conversation,
  message,
  renderChat,
} from '../../../test/chat-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { collectImports, collectPackages } from '../../../test/module-imports.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';

installEditorDom();

const assistantChat = { participants: assistantPeople, currentUserId: 'sam' };

const awaiting: ChatMessageData = {
  id: 'r1',
  authorId: 'helper',
  createdAt: '2026-04-20T10:01:00',
  status: 'streaming',
  parts: [
    {
      type: 'tool-call',
      id: 'book',
      name: 'book_table',
      label: 'Book a table',
      status: 'approval-requested',
      approval: { scopeLabel: 'this trip' },
    },
  ],
};

/** A reply that asks one question, as card `ask` of message `r2`. */
function askingReply(question: string, labels: [string, string]): ChatMessageData {
  return {
    id: 'r2',
    authorId: 'helper',
    createdAt: '2026-04-20T10:02:00',
    status: 'complete',
    parts: [
      {
        type: 'question',
        id: 'ask',
        status: 'pending',
        questions: [
          {
            id: 'pace',
            question,
            selectionMode: 'single',
            options: labels.map((label) => ({ id: label.toLowerCase(), label })),
          },
        ],
      },
    ],
  };
}

describe('Chat', () => {
  it('UIC-CHAT-1.1 ships from its own entry point and stays out of the package root', () => {
    const root = [...collectImports(join(process.cwd(), 'src/index.ts'))];
    const chatDir = `${sep}components${sep}chat${sep}`;
    expect(root.filter((file) => file.includes(chatDir))).toEqual([]);
    expect(collectPackages('src/components/chat/index.ts')).toContain('prosemirror-state');
    const entry = readFileSync(join(process.cwd(), 'src/components/chat/index.ts'), 'utf8');
    expect(entry).toMatch(/export \{ Chat, ChatHeader \}/);
  });

  it('UIC-CHAT-1.2 UIC-CHAT-6.1 lays out the header, transcript, activity, queue and composer', () => {
    const { container } = renderChat({
      id: 'team',
      className: 'caller',
      'data-testid': 'probe',
      title: 'Hiking group',
      showSearch: true,
      typingIds: ['ana'],
      queue: [{ id: 'q1', text: 'And lunch?' }],
      onQueueChange: () => undefined,
    });
    const root = container.querySelector('.ui-chat') as HTMLElement;
    expect(root).toHaveAttribute('id', 'team');
    expect(root).toHaveClass('caller');
    expect(root).toHaveAttribute('data-testid', 'probe');
    const order = [...root.children].map((child) => child.className.split(' ')[0]);
    expect(order).toEqual([
      'ui-chat-header',
      'ui-chat-transcript',
      'ui-chat-typing-indicator',
      'ui-chat__queue',
      'ui-message-composer',
    ]);
    expect(screen.getByRole('feed', { name: 'Hiking group' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT', {
      slots: ['transcript', 'typing', 'queue', 'composer', 'search-toggle'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CHAT-1.2 names the feed by the caller, else the title, else the provider string', () => {
    const { rerenderWith } = renderChat({ 'aria-label': 'Team chat', title: 'Hikers' });
    expect(screen.getByRole('feed', { name: 'Team chat' })).toBeInTheDocument();
    rerenderWith({});
    expect(screen.getByRole('feed', { name: 'Conversation' })).toBeInTheDocument();
  });

  it('UIC-CHAT-1.3 draws each author from their participant and the origin from the reader', () => {
    renderChat({
      ...assistantChat,
      messages: [message('a1', 'sam'), message('a2', 'helper'), message('a3', undefined)],
    });
    expect(article('a1')).toHaveAttribute('data-origin', 'sent');
    expect(article('a2')).toHaveAttribute('data-origin', 'received');
    expect(article('a3')).toHaveAttribute('data-origin', 'system');
    expect(article('a2').querySelector('.ui-avatar')).toHaveAttribute('data-shape', 'rounded');
    expect(article('a2')).toHaveAccessibleName(/^Trip helper, /);
  });

  it('UIC-CHAT-1.4 keeps a reply that waits for the reader out of busy and offers Retry', async () => {
    const failed = message('f1', 'sam', { delivery: 'failed' });
    const broken = message('e1', 'helper', { status: 'error', error: 'The service is busy.' });
    const { user, onRetry } = renderChat({
      ...assistantChat,
      messages: [failed, awaiting, broken],
    });
    expect(article('r1')).toHaveAttribute('data-status', 'complete');
    expect(article('r1')).not.toHaveAttribute('aria-busy');
    expect(within(article('e1')).getByRole('alert')).toHaveTextContent('The service is busy.');
    await user.click(within(article('e1')).getByRole('button', { name: 'Retry' }));
    await user.click(within(article('f1')).getByRole('button', { name: 'Retry' }));
    expect(onRetry.mock.calls).toEqual([['e1'], ['f1']]);
  });

  it('UIC-CHAT-1.5 draws the parts with the chat callbacks, the DOM ids prefixed', async () => {
    const approvals: string[] = [];
    const { user } = renderChat({
      ...assistantChat,
      messages: [awaiting],
      onApprove: (id) => approvals.push(id),
    });
    expect(document.getElementById('r1-book')).toHaveClass('ui-chat-tool-call');
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(approvals).toEqual(['book']);
  });

  it('UIC-CHAT-1.5 awaits answers through onAnswerQuestion and keeps cards to their conversation', async () => {
    const accepted = new Promise<void>(() => {});
    const onAnswerQuestion = vi
      .fn<(id: string, answers: unknown) => Promise<void>>()
      .mockRejectedValueOnce(new Error('The helper is offline.'))
      .mockReturnValueOnce(accepted)
      .mockResolvedValue(undefined);
    const trip = askingReply('How full should each day be?', ['Calm', 'Packed']);
    const { user, rerenderWith } = renderChat({ ...assistantChat, messages: [trip] });
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    const props = { ...assistantChat, conversationId: 'trip', messages: [trip], onAnswerQuestion };
    rerenderWith(props);
    await user.click(screen.getByRole('radio', { name: 'Packed' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The helper is offline.');
    expect(screen.getByRole('radio', { name: 'Packed' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onAnswerQuestion).toHaveBeenLastCalledWith('ask', [
      { questionId: 'pace', optionIds: ['packed'] },
    ]);
    expect(document.getElementById('r2-ask')).toHaveAttribute('data-submitting', 'true');
    const other = askingReply('When should the tour start?', ['Morning', 'Evening']);
    rerenderWith({ ...props, conversationId: 'tour', messages: [other] });
    const card = document.getElementById('r2-ask');
    expect(card).not.toHaveAttribute('data-submitting');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Evening' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onAnswerQuestion).toHaveBeenCalledTimes(3);
    expect(onAnswerQuestion).toHaveBeenLastCalledWith('ask', [
      { questionId: 'pace', optionIds: ['evening'] },
    ]);
  });

  it('UIC-CHAT-1.5 keeps the reader’s open and closed parts across remounts', async () => {
    const thought: ChatMessageData = {
      ...message('t1', 'helper'),
      parts: [
        { type: 'reasoning', id: 'why', text: 'Calm days.', status: 'complete', durationMs: 4000 },
      ],
    };
    const { user, rerenderWith } = renderChat({ ...assistantChat, messages: [thought] });
    const toggle = () => screen.queryByRole('button', { name: 'Thought for 4 s' });
    await user.click(toggle() as HTMLElement);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    rerenderWith({ ...assistantChat, messages: [] });
    expect(toggle()).toBeNull();
    rerenderWith({ ...assistantChat, messages: [thought] });
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-CHAT-1.5 UIC-CHAT-PARTS-5.4 keeps a failed call discoverable once the final answer arrives', async () => {
    const steps = (hotels: 'running' | 'failed'): ChatPart[] => [
      {
        type: 'reasoning',
        id: 'plan',
        text: 'Trains first.',
        status: 'complete',
        durationMs: 1000,
      },
      {
        type: 'tool-call',
        id: 'trains',
        name: 'search_trains',
        label: 'Search trains',
        status: 'succeeded',
        durationMs: 1000,
      },
      {
        type: 'tool-call',
        id: 'hotels',
        name: 'search_hotels',
        label: 'Search hotels',
        status: hotels,
        error: hotels === 'failed' ? 'The hotel service timed out.' : undefined,
      },
    ];
    const running = {
      ...message('w1', 'helper'),
      status: 'streaming' as const,
      parts: steps('running'),
    };
    const final: ChatMessageData = {
      ...running,
      status: 'complete',
      parts: [...steps('failed'), { type: 'text', text: 'Take the 8:05; no hotel answered.' }],
    };
    const { user, rerenderWith } = renderChat({ ...assistantChat, messages: [running] });
    const group = () => within(article('w1')).getByRole('button', { name: /· 3 steps$/ });
    expect(group()).toHaveAccessibleName('Working… · 3 steps');
    await user.click(group());
    expect(group()).toHaveAttribute('aria-expanded', 'false');
    rerenderWith({ ...assistantChat, messages: [final] });
    expect(group()).toHaveAccessibleName('Worked for 2 s · 3 steps');
    expect(group()).toHaveAttribute('aria-expanded', 'true');
    expect(within(article('w1')).getByRole('alert')).toHaveTextContent(
      'The hotel service timed out.',
    );
    await user.click(group());
    rerenderWith({ ...assistantChat, messages: [] });
    rerenderWith({ ...assistantChat, messages: [final] });
    expect(group()).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-CHAT-1.6 separates days, marks the first unread message and groups by author', () => {
    const { container } = renderChat({
      messages: [
        ...conversation,
        message('m4', 'ben', { text: 'And water.', createdAt: '2026-04-20T10:11:00' }),
      ],
      firstUnreadId: 'm3',
    });
    const separators = container.querySelectorAll('.ui-chat-date-separator');
    expect([...separators].map((separator) => separator.textContent)).toEqual([
      'Yesterday',
      'Today',
    ]);
    const divider = container.querySelector('.ui-chat-unread-divider');
    expect(divider?.nextElementSibling).toBe(article('m3'));
    expect(article('m3')).toHaveAttribute('data-group-position', 'first');
    expect(article('m4')).toHaveAttribute('data-group-position', 'last');
  });

  it('UIC-CHAT-1.7 anchors in an assistant chat, follows between people, and Escape goes to the composer', async () => {
    const { container, rerenderWith, user } = renderChat();
    expect(container.querySelector('.ui-chat-transcript__spacer')).toBeNull();
    act(() => article('m3').focus());
    await user.keyboard('{Escape}');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus();
    rerenderWith({ ...assistantChat, messages: [message('a', 'helper')] });
    expect(container.querySelector('.ui-chat-transcript__spacer')).not.toBeNull();
  });

  it('UIC-CHAT-1.7 takes the scroll mode, empty state, history and virtualization of the transcript', () => {
    const { container, rerenderWith } = renderChat({
      participants: assistantPeople,
      scrollMode: 'follow',
      hasOlder: true,
      isLoadingOlder: true,
      virtualized: true,
    });
    const transcript = container.querySelector('.ui-chat__transcript') as HTMLElement;
    expect(container.querySelector('.ui-chat-transcript__spacer')).toBeNull();
    expect(transcript).toHaveAttribute('data-virtualized', 'true');
    expect(screen.getByRole('progressbar', { name: 'Loading older messages' })).toBeVisible();
    rerenderWith({ messages: [], emptyState: <p>Ask me anything</p> });
    expect(screen.getByText('Ask me anything')).toBeVisible();
    expect(screen.queryByRole('feed')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-4.1 shows who is typing, or the assistant thinking before its first part', () => {
    const { rerenderWith } = renderChat({ typingIds: ['ana', 'sam'] });
    const indicator = () => document.querySelector('.ui-chat__typing') as HTMLElement;
    expect(indicator()).toHaveTextContent('Ana Lopez is typing…');
    const thinking = { ...message('r', 'helper'), parts: [], status: 'streaming' as const };
    rerenderWith({ ...assistantChat, messages: [thinking] });
    expect(indicator()).toHaveAttribute('data-variant', 'thinking');
    expect(indicator()).toHaveTextContent('Trip helper is thinking…');
    rerenderWith({ ...assistantChat, messages: [] });
    expect(indicator()).toHaveAttribute('data-empty', 'true');
  });

  it('UIC-CHAT-4.2 UIC-CHAT-5.1 shows the streaming reply’s status in the status line and the header', () => {
    const working = { ...awaiting, parts: [], statusText: 'Searching trains…' };
    const { container, rerenderWith } = renderChat({
      ...assistantChat,
      title: 'Trip helper',
      messages: [working],
    });
    expect(container.querySelector('.ui-chat__status')).toHaveTextContent('Searching trains…');
    expect(container.querySelector('.ui-chat-header__status')).toHaveTextContent(
      'Searching trains…',
    );
    rerenderWith({ ...assistantChat, messages: [{ ...working, status: 'complete' }] });
    expect(container.querySelector('.ui-chat__status')).toBeNull();
  });

  it('UIC-CHAT-4.3 shows who read up to each message, the reader left out', () => {
    renderChat({ readPositions: { ana: 'm3', sam: 'm3', ben: 'm2' } });
    expect(within(article('m3')).getByRole('group', { name: 'Seen by Ana Lopez' })).toBeVisible();
    expect(within(article('m2')).getByRole('group', { name: 'Seen by Ben Carter' })).toBeVisible();
  });

  it('UIC-CHAT-5.1 shows the header only with a title, controls or search, with who is typing', () => {
    const { container, rerenderWith } = renderChat({
      typingIds: ['ben'],
      headerActions: <button type="button">Mute</button>,
    });
    const header = container.querySelector('.ui-chat-header') as HTMLElement;
    expect(header.querySelector('.ui-chat-header__status')).toHaveTextContent(
      'Ben Carter is typing…',
    );
    expect(within(header).getByRole('button', { name: 'Mute' })).toBeVisible();
    expect(within(header).getAllByRole('img')).toHaveLength(2);
    rerenderWith({});
    expect(container.querySelector('.ui-chat-header')).toBeNull();
  });

  it('UIC-CHAT-2.2 copies a message’s text and reports it', async () => {
    const { user, onCopy } = renderChat();
    await user.hover(article('m3'));
    await user.click(within(article('m3')).getByRole('button', { name: 'Copy' }));
    expect(await navigator.clipboard.readText()).toBe('I will bring **snacks**.');
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith('m3'));
  });

  it('UIC-CHAT-2.3 toggles a reaction chip through onReact', async () => {
    const liked = message('l1', 'ana', { reactions: [{ emoji: '👍', people: ['Ben Carter'] }] });
    const { user, onReact } = renderChat({ messages: [liked] });
    await user.click(within(article('l1')).getByRole('button', { name: /👍/ }));
    expect(onReact).toHaveBeenCalledWith('l1', '👍', true);
  });
});
