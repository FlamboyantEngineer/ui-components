import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/index.js';
import { longMessages } from './chat-long-cases.js';
import { plannerId } from './chat-samples.js';

export const numberedDetails = Array.from(
  { length: 80 },
  (_, index) => `${index + 1}. <entry> **literal** check ${index + 1}`,
).join('\n');

const results: ChatPart[] = [
  {
    type: 'tool-call',
    id: 'approval-retained',
    name: 'apply_change',
    label: 'Apply a change',
    kind: 'edit',
    status: 'approval-requested',
    grouping: 'standalone',
    defaultExpanded: false,
  },
  {
    type: 'tool-call',
    id: 'checks',
    name: 'check_items',
    label: '80 new check errors',
    kind: 'command',
    status: 'failed',
    grouping: 'standalone',
    defaultExpanded: false,
    result: numberedDetails,
    durationMs: 1200,
  },
  {
    type: 'tool-call',
    id: 'single-check',
    name: 'check_item',
    label: '1 new check error',
    kind: 'read',
    status: 'failed',
    grouping: 'standalone',
    result: '1. One literal detail.',
  },
  {
    type: 'tool-call',
    id: 'empty-check',
    name: 'check_empty',
    label: 'No check details',
    kind: 'command',
    status: 'succeeded',
    grouping: 'standalone',
  },
  {
    type: 'question',
    id: 'follow-up',
    status: 'pending',
    questions: [
      {
        id: 'colour',
        selectionMode: 'single',
        question: 'Which colour?',
        options: [
          { id: 'blue', label: 'Blue' },
          { id: 'green', label: 'Green' },
        ],
      },
      { id: 'note', question: 'Any notes?', selectionMode: 'none', options: [] },
    ],
  },
];

export const nativeMessages: readonly ChatMessageData[] = [
  ...longMessages,
  { id: 'native-results', authorId: plannerId, createdAt: '2026-05-01T12:00:00Z', parts: results },
  {
    id: 'native-thinking',
    authorId: plannerId,
    createdAt: '2026-05-01T12:01:00Z',
    parts: [],
    status: 'streaming',
    statusText: 'Checking the remaining items…',
  },
];

/** This fixture's immutable JSON transport retains unchanged messages at its input boundary. */
export function retainChatSnapshot(
  previous: readonly ChatMessageData[],
  snapshot: readonly ChatMessageData[],
): readonly ChatMessageData[] {
  const byId = new Map(previous.map((message) => [message.id, message]));
  const next = snapshot.map((message) => {
    const old = byId.get(message.id);
    return old && JSON.stringify(old) === JSON.stringify(message) ? old : message;
  });
  return next.length === previous.length &&
    next.every((message, index) => message === previous[index])
    ? previous
    : next;
}
