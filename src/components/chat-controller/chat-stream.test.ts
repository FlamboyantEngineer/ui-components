import { describe, expect, it } from 'vitest';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import { type ChatStreamContext, type ChatStreamEvent, reduceChatStream } from './chat-stream.js';

const reply = (parts: readonly ChatPart[] = []): ChatMessageData => ({
  id: 'reply',
  authorId: 'helper',
  createdAt: '2026-04-20T10:00:00.000Z',
  parts,
  status: 'streaming',
});

function fold(
  events: readonly ChatStreamEvent[],
  context?: ChatStreamContext,
  start: ChatMessageData = reply(),
) {
  return events.reduce((message, event) => reduceChatStream(message, event, context), start);
}

const search = { type: 'tool-call', id: 'call-1', name: 'search_recipes' } as const;

describe('reduceChatStream', () => {
  it('UIC-CHAT-CONTROLLER-1.1 appends text deltas to the open text part', () => {
    const message = fold([
      { type: 'text-delta', text: 'Soak the ' },
      { type: 'text-delta', text: 'beans.' },
    ]);
    expect(message.parts).toEqual([{ type: 'text', text: 'Soak the beans.', status: 'streaming' }]);
  });

  it('UIC-CHAT-CONTROLLER-1.1 starts a new text part after a part of another kind', () => {
    const message = fold([
      { type: 'text-delta', text: 'Looking.' },
      search,
      { type: 'text-delta', text: 'Found two.' },
    ]);
    expect(message.parts.map((part) => [part.type, 'status' in part ? part.status : ''])).toEqual([
      ['text', 'complete'],
      ['tool-call', 'running'],
      ['text', 'streaming'],
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.2 streams reasoning by id and ends it with its duration', () => {
    const message = fold([
      { type: 'reasoning-delta', id: 'r1', text: 'Which beans' },
      { type: 'reasoning-delta', id: 'r1', text: ' soak fastest?' },
      { type: 'reasoning-end', id: 'r1', durationMs: 2400 },
    ]);
    expect(message.parts).toEqual([
      {
        type: 'reasoning',
        id: 'r1',
        text: 'Which beans soak fastest?',
        status: 'complete',
        durationMs: 2400,
      },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.2 times reasoning through the context and closes it before other parts', () => {
    const context: ChatStreamContext = { getElapsed: (id) => (id === 'r1' ? 1800 : undefined) };
    const ended = fold(
      [
        { type: 'reasoning-delta', id: 'r1', text: 'Thinking' },
        { type: 'reasoning-end', id: 'r1' },
      ],
      context,
    );
    expect(ended.parts[0]).toMatchObject({ status: 'complete', durationMs: 1800 });
    const closed = fold(
      [
        { type: 'reasoning-delta', id: 'r1', text: 'Thinking' },
        { type: 'text-delta', text: 'Answer' },
      ],
      context,
    );
    expect(closed.parts[0]).toMatchObject({ status: 'complete', durationMs: 1800 });
    const next = fold(
      [
        { type: 'reasoning-delta', id: 'r1', text: 'First' },
        { type: 'reasoning-delta', id: 'r2', text: 'Second' },
      ],
      context,
    );
    expect(next.parts.map((part) => 'status' in part && part.status)).toEqual([
      'complete',
      'streaming',
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.3 starts a tool call running and updates it by id', () => {
    const message = fold([
      { ...search, args: { query: 'beans' } },
      {
        ...search,
        label: 'Searched recipes',
        target: 'black beans',
        kind: 'search',
        args: { query: 'black beans' },
      },
    ]);
    expect(message.parts).toEqual([
      {
        type: 'tool-call',
        id: 'call-1',
        name: 'search_recipes',
        label: 'Searched recipes',
        target: 'black beans',
        kind: 'search',
        status: 'running',
        args: { query: 'black beans' },
      },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.3 ends a tool call with its result or error', () => {
    const succeeded = fold([
      search,
      { type: 'tool-result', id: 'call-1', result: ['Chili'], durationMs: 900 },
    ]);
    expect(succeeded.parts[0]).toMatchObject({
      status: 'succeeded',
      result: ['Chili'],
      durationMs: 900,
    });
    const failed = fold([search, { type: 'tool-result', id: 'call-1', error: 'Offline' }], {
      getElapsed: () => 300,
    });
    expect(failed.parts[0]).toMatchObject({ status: 'failed', error: 'Offline', durationMs: 300 });
  });

  it('UIC-CHAT-CONTROLLER-1.3 keeps a denied call denied when its result arrives', () => {
    const denied = reply([{ ...search, status: 'denied', approval: { decision: 'denied' } }]);
    const message = reduceChatStream(denied, {
      type: 'tool-result',
      id: 'call-1',
      error: 'The reader refused.',
    });
    expect(message.parts[0]).toMatchObject({ status: 'denied', error: 'The reader refused.' });
  });

  it('UIC-CHAT-CONTROLLER-1.4 asks for approval with the scope of Always allow', () => {
    const message = fold([
      search,
      { type: 'approval-request', id: 'call-1', scopeLabel: 'this conversation' },
    ]);
    expect(message.parts[0]).toMatchObject({
      status: 'approval-requested',
      approval: { scopeLabel: 'this conversation' },
    });
  });

  it('UIC-CHAT-CONTROLLER-1.4 approves a tool the reader always allows without asking', () => {
    const message = fold([search, { type: 'approval-request', id: 'call-1', await: true }], {
      alwaysAllowed: ['search_recipes'],
    });
    expect(message.parts[0]).toMatchObject({
      status: 'running',
      approval: { isAutoApproved: true },
    });
  });

  it('UIC-CHAT-CONTROLLER-1.5 adds a pending question card', () => {
    const questions = [
      { id: 'q1', question: 'Which beans?', selectionMode: 'single', options: [] },
    ] as const;
    const message = fold([{ type: 'question', id: 'card', questions }]);
    expect(message.parts).toEqual([{ type: 'question', id: 'card', questions, status: 'pending' }]);
  });

  it('UIC-CHAT-CONTROLLER-1.5 keeps an answered card answered when it arrives again', () => {
    const answered = reply([{ type: 'question', id: 'card', questions: [], status: 'answered' }]);
    const message = reduceChatStream(answered, { type: 'question', id: 'card', questions: [] });
    expect(message.parts[0]).toMatchObject({ status: 'answered' });
  });

  it('UIC-CHAT-CONTROLLER-1.5 adds a plan, replaces it by id and moves its steps', () => {
    const message = fold([
      { type: 'plan', id: 'p', steps: [{ id: 's1', label: 'Soak', status: 'pending' }] },
      {
        type: 'plan',
        id: 'p',
        title: 'Dinner',
        steps: [
          { id: 's1', label: 'Soak', status: 'pending' },
          { id: 's2', label: 'Cook', status: 'pending' },
        ],
      },
      { type: 'plan-step', planId: 'p', stepId: 's1', status: 'done' },
    ]);
    expect(message.parts).toEqual([
      {
        type: 'plan',
        id: 'p',
        title: 'Dinner',
        steps: [
          { id: 's1', label: 'Soak', status: 'done' },
          { id: 's2', label: 'Cook', status: 'pending' },
        ],
      },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.5 updates a plan in place without breaking the open text', () => {
    const steps = [{ id: 's1', label: 'Soak', status: 'pending' }] as const;
    const message = fold([
      { type: 'plan', id: 'p', steps },
      { type: 'text-delta', text: 'Soaking ' },
      { type: 'plan', id: 'p', steps: [{ ...steps[0], status: 'done' }] },
      { type: 'text-delta', text: 'done.' },
    ]);
    expect(message.parts).toEqual([
      { type: 'plan', id: 'p', steps: [{ id: 's1', label: 'Soak', status: 'done' }] },
      { type: 'text', text: 'Soaking done.', status: 'streaming' },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.6 gathers sources in one part where the first arrives', () => {
    const message = fold([
      { type: 'source', source: { id: 'a', title: 'Bean guide' } },
      { type: 'text-delta', text: 'Soak them [1]' },
      { type: 'source', source: { id: 'b', title: 'Pressure cooking' } },
      { type: 'source', source: { id: 'a', title: 'Bean guide, 2nd edition' } },
      { type: 'text-delta', text: ' or cook them under pressure [2].' },
    ]);
    expect(message.parts).toEqual([
      {
        type: 'sources',
        id: 'sources',
        sources: [
          { id: 'a', title: 'Bean guide, 2nd edition' },
          { id: 'b', title: 'Pressure cooking' },
        ],
      },
      {
        type: 'text',
        text: 'Soak them [1] or cook them under pressure [2].',
        status: 'streaming',
      },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.6 keeps text open while sources arrive after it', () => {
    const message = fold([
      { type: 'text-delta', text: 'Soak them [1]' },
      { type: 'source', source: { id: 'a', title: 'Bean guide' } },
      { type: 'text-delta', text: ' overnight.' },
    ]);
    expect(message.parts).toEqual([
      { type: 'text', text: 'Soak them [1] overnight.', status: 'streaming' },
      { type: 'sources', id: 'sources', sources: [{ id: 'a', title: 'Bean guide' }] },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.6 adds files to the files part just before, else a new one', () => {
    const file = (id: string) => ({ id, name: `${id}.png`, mediaType: 'image/png' });
    const message = fold([
      { type: 'file', attachment: file('one') },
      { type: 'file', attachment: file('two') },
      { type: 'text-delta', text: 'And a third:' },
      { type: 'file', attachment: file('three') },
    ]);
    expect(message.parts).toEqual([
      { type: 'files', attachments: [file('one'), file('two')] },
      { type: 'text', text: 'And a third:', status: 'complete' },
      { type: 'files', attachments: [file('three')] },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.6 adds code, diffs and custom parts, replacing them by id', () => {
    const message = fold([
      { type: 'code', id: 'c', code: 'npm i', variant: 'terminal' },
      { type: 'code', id: 'c', code: 'npm install', variant: 'terminal' },
      { type: 'code', code: 'const a = 1;', language: 'ts' },
      { type: 'diff', title: 'notes.md', oldText: 'a', newText: 'b' },
      { type: 'custom', id: 'map', name: 'map', data: { zoom: 3 } },
    ]);
    expect(message.parts).toEqual([
      { type: 'code', id: 'c', code: 'npm install', variant: 'terminal' },
      { type: 'code', code: 'const a = 1;', language: 'ts' },
      { type: 'diff', title: 'notes.md', oldText: 'a', newText: 'b' },
      { type: 'custom', id: 'map', name: 'map', data: { zoom: 3 } },
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.7 sets and clears the status line', () => {
    const working = reduceChatStream(reply(), { type: 'status', text: 'Searching recipes…' });
    expect(working.statusText).toBe('Searching recipes…');
    expect(reduceChatStream(working, { type: 'status', text: '' }).statusText).toBeUndefined();
  });

  it('UIC-CHAT-CONTROLLER-1.7 completes the reply on finish and keeps what waits for the reader', () => {
    const message = fold([
      { type: 'status', text: 'Working' },
      { type: 'text-delta', text: 'Done.' },
      search,
      { type: 'tool-call', id: 'call-2', name: 'delete_draft' },
      { type: 'approval-request', id: 'call-2' },
      { type: 'question', id: 'card', questions: [] },
      { type: 'finish' },
    ]);
    expect(message.status).toBe('complete');
    expect(message.statusText).toBeUndefined();
    expect(message.parts.map((part) => 'status' in part && part.status)).toEqual([
      'complete',
      'cancelled',
      'approval-requested',
      'pending',
    ]);
  });

  it('UIC-CHAT-CONTROLLER-1.7 fails the reply on error and cancels what waits', () => {
    const message = fold([
      { type: 'reasoning-delta', id: 'r1', text: 'Hmm' },
      search,
      { type: 'approval-request', id: 'call-1' },
      { type: 'question', id: 'card', questions: [] },
      { type: 'error', message: 'The model is busy.' },
    ]);
    expect(message).toMatchObject({ status: 'error', error: 'The model is busy.' });
    expect(message.parts.map((part) => 'status' in part && part.status)).toEqual([
      'complete',
      'cancelled',
      'dismissed',
    ]);
  });

  it.each(['finish', 'error'] as const)(
    'UIC-CHAT-CONTROLLER-1.7 settles unfinished calls on %s while keeping terminal states and part identity',
    (type) => {
      const approvals = [
        { decision: 'approved' },
        { decision: 'always' },
        { isAutoApproved: true },
      ] as const;
      const approved = approvals.map((approval, index): ChatPart => ({
        type: 'tool-call',
        id: `approved-${index}`,
        name: 'rename_recipe',
        status: 'running',
        approval,
      }));
      const start = reply([
        ...approved,
        { type: 'tool-call', id: 'ordinary', name: 'search_recipes', status: 'running' },
        {
          type: 'tool-call',
          id: 'pending',
          name: 'rename_recipe',
          status: 'pending',
          approval: approvals[0],
        },
        ...(['succeeded', 'failed', 'denied', 'cancelled'] as const).map((status): ChatPart => ({
          type: 'tool-call',
          id: status,
          name: 'rename_recipe',
          status,
          approval: approvals[0],
        })),
      ]);
      const snapshot = structuredClone(start);
      const next = reduceChatStream(
        start,
        type === 'finish' ? { type } : { type, message: 'Unavailable' },
      );
      expect(start).toEqual(snapshot);
      expect(next.parts.map((part) => 'status' in part && part.status)).toEqual([
        ...approved.map(() => (type === 'finish' ? 'running' : 'cancelled')),
        'cancelled',
        'cancelled',
        'succeeded',
        'failed',
        'denied',
        'cancelled',
      ]);
      next.parts.forEach((part, index) => {
        if (index >= 5 || (type === 'finish' && index < 3)) expect(part).toBe(start.parts[index]);
      });
    },
  );

  it('UIC-CHAT-CONTROLLER-1.8 ignores events about parts the reply does not hold', () => {
    const start = reply([{ type: 'text', text: 'Hi', status: 'streaming' }]);
    for (const event of [
      { type: 'tool-result', id: 'nope', result: 1 },
      { type: 'approval-request', id: 'nope' },
      { type: 'reasoning-end', id: 'nope' },
      { type: 'plan-step', planId: 'nope', stepId: 's', status: 'done' },
    ] satisfies ChatStreamEvent[]) {
      expect(reduceChatStream(start, event)).toEqual(start);
    }
  });

  it('UIC-CHAT-CONTROLLER-1.8 leaves the given reply unchanged and keeps untouched parts', () => {
    const start = reply([
      { type: 'text', text: 'Hi', status: 'complete' },
      { type: 'text', text: 'There', status: 'streaming' },
    ]);
    const snapshot = structuredClone(start);
    const next = reduceChatStream(start, { type: 'text-delta', text: '!' });
    expect(start).toEqual(snapshot);
    expect(next.parts[0]).toBe(start.parts[0]);
    expect(next.parts[1]).toMatchObject({ text: 'There!' });
  });
});
