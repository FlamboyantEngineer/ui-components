// The Chat lab's states: an empty conversation with suggested starters, plain text against the
// Markdown default, a disabled composer, and right to left.

import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { UiProvider } from '../../src/core/provider.js';
import { Cluster } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { assistantPeople, getLabNow, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const states = ['markdown', 'plain text', 'disabled', 'right to left'] as const;

type ChatState = (typeof states)[number];

const starters = ['Plan a weekend in Lisbon', 'Which day is best for the castle?'];

/** Suggested first questions, in the transcript's empty state. */
function Starters({ onPick }: { onPick: (text: string) => void }) {
  return (
    <Cluster space="sm" data-lab-starters="">
      {starters.map((text) => (
        <Button key={text} size="sm" onPress={() => onPick(text)}>
          {text}
        </Button>
      ))}
    </Cluster>
  );
}

function EmptyDemo() {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
  });
  return (
    <div style={{ height: 420 }} data-lab-demo="empty">
      <Chat
        {...controller.props}
        aria-label="New conversation with the trip planner"
        participants={assistantPeople}
        currentUserId={readerId}
        placeholder="Ask the trip planner…"
        emptyState={<Starters onPick={(text) => controller.send(text)} />}
      />
    </div>
  );
}

/** The same short conversation in each state, with ids unique to its cell. */
function stateMessages(state: ChatState): ChatMessageData[] {
  const prefix = `state-${states.indexOf(state)}`;
  return [
    textMessage({
      id: `${prefix}-1`,
      authorId: readerId,
      time: '2026-04-20T10:00:00',
      text: 'What should I pack?',
    }),
    textMessage({
      id: `${prefix}-2`,
      authorId: plannerId,
      time: '2026-04-20T10:01:00',
      text: 'Pack **layers** and `walking shoes`:\n- a light jacket\n- sunscreen',
    }),
  ];
}

function StateSample({ state }: { state: ChatState }) {
  const isRtl = state === 'right to left';
  const chat = (
    <div style={{ height: 320 }} dir={isRtl ? 'rtl' : undefined}>
      <Chat
        aria-label={`Conversation (${state})`}
        messages={stateMessages(state)}
        participants={assistantPeople}
        currentUserId={readerId}
        getNow={getLabNow}
        textFormat={state === 'plain text' ? 'plain' : undefined}
        isDisabled={state === 'disabled'}
        placeholder="Ask the trip planner…"
        onSend={() => undefined}
      />
    </div>
  );
  return isRtl ? <UiProvider locale="ar-EG">{chat}</UiProvider> : chat;
}

export function ChatStateCases() {
  return (
    <>
      <LabSection
        title="Starting a conversation"
        description="With no messages, the transcript shows the host's empty state: here, suggested first questions that send themselves."
      >
        <EmptyDemo />
      </LabSection>
      <LabSection
        title="States"
        description="Text renders as Markdown by default; textFormat plain shows it as written, line breaks kept. isDisabled refuses new messages while the conversation stays readable. In a right-to-left locale the layout mirrors."
      >
        <StateMatrix
          axes={{ state: states }}
          render={({ state }) => <StateSample state={state} />}
        />
      </LabSection>
    </>
  );
}
