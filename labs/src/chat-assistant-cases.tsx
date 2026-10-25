// The Chat lab's live assistant: a fake streaming trip planner driven through useChatController.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { Stack } from '../../src/components/layout/layout.js';
import { Radio, RadioGroup } from '../../src/components/radio-group/radio-group.js';
import { agentBehaviours, agents, fakeUpload, type AgentBehaviour } from './chat-agent.js';
import { forecastRenderer, renderLabPart } from './chat-parts-samples.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

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

const feedbackReasons = ['Accurate', 'Helpful', 'Too long', 'Out of date'];

/** The callbacks the host received, newest last, for the lab to show. */
function useCallbackLog() {
  const [log, setLog] = useState<string[]>([]);
  return [log, (line: string) => setLog((lines) => [...lines.slice(-5), line])] as const;
}

/** The live assistant: the behaviour picker, the chat, and what the host received. */
function AssistantDemo() {
  const [behaviour, setBehaviour] = useState<AgentBehaviour>('answer');
  const [allowed, setAllowed] = useState<readonly string[]>([]);
  const [log, record] = useCallbackLog();
  const controller = useChatController({
    send: agents[behaviour],
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages,
    upload: fakeUpload,
    alwaysAllowed: allowed,
    onAlwaysAllowedChange: setAllowed,
  });
  return (
    <Stack space="sm" data-lab-demo="assistant">
      <RadioGroup
        label="Agent behaviour for the next message"
        orientation="horizontal"
        value={behaviour}
        onChange={(value) => setBehaviour((value ?? 'answer') as AgentBehaviour)}
      >
        {Object.entries(agentBehaviours).map(([value, label]) => (
          <Radio key={value} value={value}>
            {label}
          </Radio>
        ))}
      </RadioGroup>
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
          toolRenderers={{ get_weather: forecastRenderer }}
          renderPart={renderLabPart}
          onApplyCode={(code) => record(`applied ${code.split('\n').length} lines`)}
          onCopy={(id) => record(`copied ${id}`)}
          feedbackReasons={feedbackReasons}
          onFeedback={(id, feedback) => {
            record(`rated ${feedback.rating ?? 'none'} ${feedback.reasons.join(', ')}`.trim());
            controller.setMessages((messages) =>
              messages.map((message) =>
                message.id === id
                  ? { ...message, feedback: feedback.rating ?? undefined }
                  : message,
              ),
            );
          }}
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
      description="A fake trip planner streams through useChatController. Pick what it does with your next message: an answer whose reasoning and tool calls fold into steps (the forecast uses a custom tool renderer) with a live status line, then streamed Markdown with a table, code (Copy and Apply) and citations with their sources; a booking awaited in the stream, or a cancellation answered by a new turn (Approve, Deny with a reason, Always allow); a card of three questions with previews; a plan that advances, then a diff and a terminal block; or a reply that fails once (Retry). Stop ends a reply and keeps its text; messages sent while it runs wait in the queue above the composer, where you can edit or remove them. Attach files (a file named broken… fails its first upload: Retry), press Up in the empty composer to recall earlier prompts, type / for a command, and copy or rate a reply with reasons."
    >
      <AssistantDemo />
    </LabSection>
  );
}
