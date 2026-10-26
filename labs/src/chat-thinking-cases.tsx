// The Chat lab's thinking states: a reply that streams says what the assistant is thinking or
// doing, inside the reply, until its text streams in.

import type { ReactNode } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/index.js';
import { assistantPeople, getLabNow, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const states = [
  'before any part',
  'custom text',
  'custom icon',
  'status text',
  'reasoning',
  'writing',
] as const;

type ThinkingState = (typeof states)[number];

const reasoning: ChatPart = {
  type: 'reasoning',
  id: 'why',
  text: 'The castle opens at nine, so the morning suits it best.',
  status: 'streaming',
};

const partsByState: Partial<Record<ThinkingState, ChatPart[]>> = {
  reasoning: [reasoning],
  writing: [{ type: 'text', text: 'Saturday morning suits the castle', status: 'streaming' }],
};

/** A decorative four-pointed star, standing in for a host's own icon. */
const sparkle: ReactNode = (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" focusable="false">
    <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
  </svg>
);

/** The reader's question and the reply streaming in, with ids unique to the cell. */
function thinkingMessages(state: ThinkingState): ChatMessageData[] {
  const prefix = `thinking-${states.indexOf(state)}`;
  return [
    textMessage({
      id: `${prefix}-1`,
      authorId: readerId,
      time: '2026-04-20T10:00:00',
      text: 'Which day is best for the castle?',
    }),
    {
      id: `${prefix}-2`,
      authorId: plannerId,
      createdAt: '2026-04-20T10:00:05',
      status: 'streaming',
      parts: partsByState[state] ?? [],
      statusText: state === 'status text' ? 'Checking opening hours…' : undefined,
    },
  ];
}

function ThinkingSample({ state }: { state: ThinkingState }) {
  return (
    <div style={{ height: 320 }}>
      <Chat
        aria-label={`Conversation (${state})`}
        messages={thinkingMessages(state)}
        participants={assistantPeople}
        currentUserId={readerId}
        getNow={getLabNow}
        scrollMode="follow"
        thinkingText={state === 'custom text' || state === 'custom icon' ? 'Pondering…' : undefined}
        thinkingIcon={state === 'custom icon' ? sparkle : undefined}
        placeholder="Ask the trip planner…"
        onSend={() => undefined}
      />
    </div>
  );
}

export function ChatThinkingCases() {
  return (
    <LabSection
      title="Thinking"
      description="While a reply streams and the assistant thinks or acts, the reply ends with a shimmering line: Thinking… by default, the chat's thinkingText, or the reply's statusText when it says what it does; thinkingIcon replaces the busy indicator. The line stays through reasoning and tool calls and goes once the text streams in. Who is typing still shows below the transcript."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) => <ThinkingSample state={state} />}
      />
    </LabSection>
  );
}
