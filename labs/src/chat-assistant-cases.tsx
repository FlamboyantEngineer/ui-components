// The Chat lab's live assistant: a fake streaming trip planner driven through useChatController.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import { ChatModelPicker } from '../../src/components/chat-model-picker/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { Stack } from '../../src/components/layout/layout.js';
import { Choice, ChoiceGroup } from '../../src/components/choice-group/choice-group.js';
import {
  agentBehaviours,
  agents,
  fakeUpload,
  withModelNote,
  type AgentBehaviour,
} from './chat-agent.js';
import { createReplyHandlers, useCallbackLog, useLabModelChoice } from './chat-assistant-host.js';
import { forecastRenderer, renderLabPart } from './chat-parts-samples.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const initialMessages: ChatMessageData[] = [
  {
    id: 'assistant-hello',
    authorId: readerId,
    createdAt: '2026-04-20T09:58:00',
    parts: [{ type: 'text', text: 'Which day is best for the castle?' }],
  },
  {
    id: 'assistant-hello-reply',
    authorId: plannerId,
    createdAt: '2026-04-20T09:58:10',
    parts: [
      {
        type: 'text',
        text: 'Go on **Saturday morning**: it opens at nine and the queue is short before ten.',
      },
    ],
  },
];

const commands = [
  { id: 'summarize', label: 'summarize', description: 'Answer in short' },
  { id: 'budget', label: 'budget', description: 'Keep an eye on costs' },
];

/** The live assistant: the behaviour picker, the chat, and what the host received. */
function AssistantDemo() {
  const [behaviour, setBehaviour] = useState<AgentBehaviour>('answer');
  const [allowed, setAllowed] = useState<readonly string[]>([]);
  const { modelPicker, choice } = useLabModelChoice();
  const [log, record] = useCallbackLog();
  const controller = useChatController({
    send: withModelNote(agents[behaviour], choice),
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages,
    upload: fakeUpload,
    alwaysAllowed: allowed,
    onAlwaysAllowedChange: setAllowed,
  });
  return (
    <Stack space="sm" data-lab-demo="assistant">
      <ChoiceGroup
        label="Agent behaviour for the next message"
        orientation="horizontal"
        value={behaviour}
        onChange={(value) => setBehaviour((value ?? 'answer') as AgentBehaviour)}
      >
        {Object.entries(agentBehaviours).map(([value, label]) => (
          <Choice key={value} value={value}>
            {label}
          </Choice>
        ))}
      </ChoiceGroup>
      <div style={{ height: 620 }}>
        <Chat
          {...controller.props}
          participants={assistantPeople}
          currentUserId={readerId}
          conversationId="lab-assistant"
          title="Trip planner"
          showSearch
          placeholder="Ask the trip planner…"
          commands={commands}
          composerEndControls={<ChatModelPicker {...modelPicker} />}
          toolRenderers={{ get_weather: forecastRenderer }}
          renderPart={renderLabPart}
          {...createReplyHandlers(controller.updateMessages, record)}
        />
      </div>
      <p>
        Always allowed: <output data-lab-output="allowed">{allowed.join(', ') || 'nothing'}</output>
        {' · '}
        Host callbacks: <output data-lab-output="assistant-log">{log.join(' · ') || 'none'}</output>
      </p>
    </Stack>
  );
}

export function ChatAssistantCases() {
  return (
    <LabSection
      title="Assistant, live"
      description="A fake trip planner streams through useChatController. Pick what it does with your next message: an answer whose reasoning and tool calls fold into steps (the forecast uses a custom tool renderer) with a live status line, then streamed Markdown with a table, code (Copy and Apply) and citations with their sources; a booking awaited in the stream, or a cancellation answered by a new turn (Approve, Deny with a reason, Always allow); a card of three questions with previews; a plan that advances, then a diff and a terminal block; or a reply that fails once (Retry). Stop ends a reply and keeps its text; messages sent while it runs wait in the queue above the composer, where you can edit or remove them. Attach files (a file named broken… fails its first upload, and one named huge… is refused before it starts: Retry), press Up in the empty composer to recall earlier prompts, type / for a command, and copy or rate a reply with reasons. The model picker beside the send button chooses the model and effort of your next message, and each reply names the ones it was sent with."
    >
      <AssistantDemo />
    </LabSection>
  );
}

/** An assistant in a short frame, to keep typing while a long reply streams. */
function TypingWhileStreamingDemo({
  scrollMode,
  history,
}: {
  scrollMode: 'anchor' | 'follow';
  history: 'plain' | 'virtualized';
}) {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages,
  });
  return (
    <div style={{ height: 420 }}>
      <Chat
        {...controller.props}
        participants={assistantPeople}
        currentUserId={readerId}
        conversationId={`lab-typing-${scrollMode}-${history}`}
        title="Trip planner"
        scrollMode={scrollMode}
        virtualized={history === 'virtualized'}
        placeholder="Ask, then keep typing…"
        toolRenderers={{ get_weather: forecastRenderer }}
        renderPart={renderLabPart}
      />
    </div>
  );
}

export function ChatTypingWhileStreamingCases() {
  return (
    <LabSection
      title="Typing while a reply streams"
      description="Short chats that follow the latest message. Send a question (an anchoring chat keeps it at the top: scroll to the bottom or press Jump to latest to follow the reply), then type your next message while the answer streams, adding lines with Shift+Enter so the composer grows: the transcript keeps following, and your draft and focus stay put. Scroll up first and typing keeps your place instead."
    >
      <StateMatrix
        axes={{
          scrollMode: ['anchor', 'follow'] as const,
          history: ['plain', 'virtualized'] as const,
        }}
        render={({ scrollMode, history }) => (
          <TypingWhileStreamingDemo scrollMode={scrollMode} history={history} />
        )}
      />
    </LabSection>
  );
}
