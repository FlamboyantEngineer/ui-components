// The Chat lab's states: an empty conversation with a welcome and suggested starters, plain text
// against the Markdown default, a disabled composer, and right to left.

import { SparklesGlyph } from '../../src/core/glyphs.js';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import { ChatModelPicker } from '../../src/components/chat-model-picker/index.js';
import { EmptyState } from '../../src/components/empty-state/empty-state.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { UiProvider } from '../../src/core/provider.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { labDisclaimer } from './chat-assistant-cases.js';
import { labEfforts, labModels } from './chat-model-samples.js';
import { assistantPeople, getLabNow, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const states = ['markdown', 'plain text', 'disabled', 'right to left'] as const;

type ChatState = (typeof states)[number];

const starters = [
  'Plan a weekend in Lisbon',
  'Which day is best for the castle?',
  'What should I pack for May?',
];

/** How many first questions the empty conversation suggests. */
const suggestionCounts = ['several', 'none'] as const;

type SuggestionCount = (typeof suggestionCounts)[number];

/**
 * The empty conversation's welcome, from stock parts in the transcript's empty state: what the
 * assistant is for, and suggested first questions that send themselves, if any.
 */
function Welcome({
  suggestions,
  onPick,
}: {
  suggestions: readonly string[];
  onPick: (text: string) => void;
}) {
  return (
    <EmptyState
      icon={SparklesGlyph}
      title="Plan your next trip"
      description="Ask about places to see, the best days to go and what to pack. Pick a question to start, or write your own."
      actions={
        suggestions.length > 0 ? (
          <Cluster space="sm" data-lab-starters="">
            {suggestions.map((text) => (
              <Button key={text} size="sm" content="sentence" onPress={() => onPick(text)}>
                {text}
              </Button>
            ))}
          </Cluster>
        ) : null
      }
    />
  );
}

function EmptyDemo({ suggestions }: { suggestions: SuggestionCount }) {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
  });
  return (
    <Stack space="sm" data-lab-demo="empty">
      <Cluster space="sm">
        <Button size="sm" onPress={() => controller.resetConversation()}>
          New conversation
        </Button>
      </Cluster>
      <div style={{ height: 460 }}>
        <Chat
          {...controller.props}
          aria-label="New conversation with the trip planner"
          participants={assistantPeople}
          currentUserId={readerId}
          placeholder="Ask the trip planner…"
          emptyState={
            <Welcome
              suggestions={suggestions === 'several' ? starters : []}
              onPick={(text) => controller.send(text)}
            />
          }
          disclaimer={labDisclaimer}
        />
      </div>
    </Stack>
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
        composerEndControls={
          <ChatModelPicker models={labModels} efforts={labEfforts} defaultModel="balanced" />
        }
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
        description="With no messages, the transcript shows the host's empty state, built from stock parts: an EmptyState welcome that says what the assistant is for, with suggested first questions as its actions that send themselves (or none: the welcome stands alone). The first message replaces it, and New conversation brings it back; it is never a message in the history. The host's disclaimer stays under the composer before and after the first message."
      >
        <StateMatrix
          axes={{ suggestions: suggestionCounts }}
          render={({ suggestions }) => <EmptyDemo suggestions={suggestions} />}
        />
      </LabSection>
      <LabSection
        title="States"
        description="Text renders as Markdown by default; textFormat plain shows it as written, line breaks kept. isDisabled refuses new messages, and the model picker with them, while the conversation stays readable. In a right-to-left locale the layout mirrors."
      >
        <StateMatrix
          axes={{ state: states }}
          render={({ state }) => <StateSample state={state} />}
        />
      </LabSection>
    </>
  );
}
