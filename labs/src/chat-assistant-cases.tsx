// The Chat lab's live assistant: an agent app whose fake trip planner streams through
// useChatController, and short chats to keep typing in while a reply streams.

import { useState } from 'react';
import {
  Chat,
  ChatList,
  type ChatMessageData,
  useChatController,
} from '../../src/components/chat/index.js';
import { Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { AgentConversation, useConversationRows } from './chat-agent-app.js';
import { agentConversations } from './chat-agent-app-samples.js';
import { useCallbackLog, useLabModelChoice } from './chat-assistant-host.js';
import { forecastRenderer, renderLabPart } from './chat-parts-samples.js';
import { assistantPeople, nextLabId, plannerId, readerId } from './chat-samples.js';
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

/** The agent app: its conversations in a list beside the open one, and what the host received. */
function AssistantDemo() {
  const [samples, setSamples] = useState(agentConversations);
  const [openId, setOpenId] = useState('agent-lisbon');
  const [allowed, setAllowed] = useState<readonly string[]>([]);
  const [tools, setTools] = useState<readonly string[]>(['web', 'maps']);
  const { modelPicker, choice } = useLabModelChoice();
  const [log, record] = useCallbackLog();
  const { rows, onSummary } = useConversationRows(samples);
  const shared = {
    modelPicker,
    choice,
    tools,
    onToolsChange: setTools,
    allowed,
    onAllowedChange: setAllowed,
    record,
  };
  const startNew = () => {
    const id = nextLabId('agent-new');
    setSamples((current) => [{ id, title: 'New chat', messages: [] }, ...current]);
    setOpenId(id);
  };
  return (
    <Stack space="sm" data-lab-demo="assistant">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px minmax(0, 1fr)',
          gap: 16,
          height: 680,
        }}
      >
        <ChatList
          aria-label="Conversations"
          heading="Recents"
          conversations={rows}
          selectedKey={openId}
          onSelectionChange={setOpenId}
          onNew={startNew}
          showSearch
        />
        <div style={{ minWidth: 0, height: '100%' }}>
          {samples.map((sample) => (
            <AgentConversation
              key={sample.id}
              sample={sample}
              isOpen={sample.id === openId}
              shared={shared}
              onSummary={onSummary}
            />
          ))}
        </div>
      </div>
      <p>
        Tools: <output data-lab-output="tools">{tools.join(', ') || 'none'}</output>
        {' · '}
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
      description="A full agent chat: earlier conversations with a fake trip planner in a list beside the open one, each holding what an agent writes. The planner reacts to the reader's messages through the controller's reaction API: 👀 while it works on a message, then 👍 (❤️ for a thank-you) once it has answered; Stop or a failure takes the 👀 back. Two days in Lisbon has photos the reader shared (the planner reacted 😍), reasoning, tool calls with their sources' letters, a custom forecast, a cited table with its sources, photos the planner found and an approved booking; Packing list an answered card of questions, a finished plan and a diff; Weekend budget a file read, a command, code and terminal output; Museums on Monday a failed search tried again and a denied cancellation. Send a message for the full answer streamed through useChatController: steps with a live status line, Markdown with a table, code (Copy and Apply) and citations, then photos. Type / for the other behaviours: book (an approval awaited in the stream: Approve, Deny with a reason, Always allow), cancel (an approval answered by a new turn), ask (questions with previews), plan (a plan, a diff and a terminal block), ferry (fails once: Retry) or summarize. A reply goes on streaming while another conversation is open, and its row says it is working. New chat opens an empty conversation with starters; its first message names it. Stop ends a reply and keeps its text; messages sent while it runs wait in the queue above the composer. The + menu at the composer's start attaches files, adds a saved place, turns the agent's tools on or off, inserts a command, and holds the composer's own Sending options (steer automatically, send with Ctrl+Enter). Attach files from it (a file named broken… fails its first upload, and one named huge… is refused before it starts), press Up in the empty composer to recall earlier prompts, and copy or rate a reply with reasons. The model picker beside the send button chooses the model and effort of your next message, and each reply names the ones it was sent with; choosing leaves the composer at rest."
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
