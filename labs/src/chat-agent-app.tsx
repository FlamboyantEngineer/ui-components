// The Chat lab's agent app: a list of conversations with a trip planner beside the open one. Each
// conversation keeps its own controller, so a reply goes on streaming while another is open.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import {
  type ChatSendFunction,
  useChatController,
} from '../../src/components/chat-controller/index.js';
import {
  ChatModelPicker,
  type ChatModelPickerProps,
} from '../../src/components/chat-model-picker/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { EmptyState } from '../../src/components/empty-state/empty-state.js';
import { Cluster } from '../../src/components/layout/layout.js';
import { MessageComposerMenuButton } from '../../src/components/message-composer/index.js';
import { SparklesGlyph } from '../../src/core/glyphs.js';
import { agents, fakeUpload, withModelNote } from './chat-agent.js';
import { type AgentConversationSample, lisbonPhotos } from './chat-agent-app-samples.js';
import { createAgentMenu } from './chat-agent-menu.js';
import { agentTiming, sleep, streamText } from './chat-agent-stream.js';
import { createReplyHandlers } from './chat-assistant-host.js';
import { plannerCommands } from './chat-everything-samples.js';
import { forecastRenderer, renderLabPart } from './chat-parts-samples.js';
import { assistantPeople, nextLabId, plannerId, readerId } from './chat-samples.js';

/** The host's own note under the composer; the library adds no wording of its own. */
export const labDisclaimer = 'AI can make mistakes. Check important information.';

const starters = ['Plan a weekend in Lisbon', 'What should I pack?', 'Find a quiet beach'];

/** The full answer, then photos of the places it names, found by one more tool call. */
const answerWithPhotos: ChatSendFunction = async function* (messages, context) {
  const { signal } = context;
  for await (const event of agents.answer(messages, context)) {
    if (event.type === 'finish') break;
    yield event;
  }
  const id = nextLabId('photos');
  yield { type: 'status', text: 'Finding photos…' };
  yield {
    type: 'tool-call',
    id,
    name: 'search_photos',
    label: 'Found photos of the places',
    kind: 'search',
    args: { places: ['Alfama', 'Belém', 'Miradouro'] },
  };
  await sleep(agentTiming.word * 8, signal);
  yield { type: 'tool-result', id, result: { photos: lisbonPhotos.length } };
  for (const photo of lisbonPhotos) {
    yield { type: 'file', attachment: { ...photo, id: nextLabId(photo.id) } };
  }
  yield { type: 'status', text: '' };
  yield* streamText('\n\nHere is how the places look.', signal);
  yield { type: 'finish' };
};

/** The slash command of the reader's last message, if it has one. */
function findCommand(messages: readonly ChatMessageData[]): string | undefined {
  const last = messages.findLast((message) => message.authorId === readerId);
  const tokens = last?.parts.flatMap((part) => (part.type === 'text' ? (part.tokens ?? []) : []));
  return tokens?.find((token: ChatTextToken) => token.kind === 'command')?.id;
}

/** Streams what the reader's last message asks for: its command, else the full answer with photos. */
const sendToAgent: ChatSendFunction = (messages, context) => {
  const command = findCommand(messages);
  const behaviour = plannerCommands.find((entry) => entry.id === command)?.behaviour;
  return (behaviour ? agents[behaviour] : answerWithPhotos)(messages, context);
};

/** What the list shows of a conversation: its title, its last words and whether it is working. */
export interface AgentConversationSummary {
  title: string;
  lastMessage: string | undefined;
  time: string | undefined;
  isWorking: boolean;
}

/** A message's last text, on one line and without Markdown marks, for the list. */
function plainText(message: ChatMessageData | undefined): string | undefined {
  const part = message?.parts.findLast((entry) => entry.type === 'text');
  if (part?.type !== 'text') return undefined;
  return part.text
    .replaceAll(/[*_#|`]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/** How the conversation sums up in the list; a new chat takes its first message as its title. */
function summarize(
  sample: AgentConversationSample,
  messages: readonly ChatMessageData[],
  isPending: boolean,
): AgentConversationSummary {
  const last = messages.at(-1);
  const isNew = sample.messages.length === 0;
  return {
    title: (isNew ? plainText(messages[0]) : undefined) ?? sample.title,
    lastMessage: plainText(last),
    time: last?.createdAt,
    isWorking: isPending,
  };
}

/** Starters for a new conversation. */
function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <EmptyState
      icon={SparklesGlyph}
      title="Plan your next trip"
      description="Ask about places to see, the best days to go and what to pack, or type / for a command."
      actions={
        <Cluster space="sm">
          {starters.map((text) => (
            <Button key={text} size="sm" content="sentence" onPress={() => onPick(text)}>
              {text}
            </Button>
          ))}
        </Cluster>
      }
    />
  );
}

/** What every conversation of the app shares: the model choice, approvals and the host's log. */
export interface AgentAppShared {
  modelPicker: ChatModelPickerProps;
  /** The tools the agent may use, chosen in the "+" menu. */
  tools: readonly string[];
  onToolsChange: (tools: readonly string[]) => void;
  choice: string;
  allowed: readonly string[];
  onAllowedChange: (allowed: readonly string[]) => void;
  record: (line: string) => void;
}

interface AgentConversationProps {
  sample: AgentConversationSample;
  isOpen: boolean;
  shared: AgentAppShared;
  onSummary: (id: string, summary: AgentConversationSummary) => void;
}

/** One conversation: its controller always, its chat while it is open. */
export function AgentConversation({ sample, isOpen, shared, onSummary }: AgentConversationProps) {
  const controller = useChatController({
    send: withModelNote(sendToAgent, shared.choice),
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages: sample.messages,
    upload: fakeUpload,
    alwaysAllowed: shared.allowed,
    onAlwaysAllowedChange: shared.onAllowedChange,
  });
  const { messages, isPending } = controller;
  const summary = summarize(sample, messages, isPending);
  const { title, lastMessage, time, isWorking } = summary;
  useEffect(() => {
    onSummary(sample.id, { title, lastMessage, time, isWorking });
  }, [onSummary, sample.id, title, lastMessage, time, isWorking]);
  if (!isOpen) return null;
  return (
    <Chat
      {...controller.props}
      participants={assistantPeople}
      currentUserId={readerId}
      conversationId={sample.id}
      title={title}
      showSearch
      placeholder="Ask the trip planner, or type / for a command…"
      commands={plannerCommands}
      composerStartControls={
        <MessageComposerMenuButton
          sections={createAgentMenu({ enabled: shared.tools, onChange: shared.onToolsChange })}
        />
      }
      showSendOptions
      composerEndControls={<ChatModelPicker {...shared.modelPicker} />}
      toolRenderers={{ get_weather: forecastRenderer }}
      renderPart={renderLabPart}
      disclaimer={labDisclaimer}
      emptyState={<Welcome onPick={(text) => controller.send(text)} />}
      {...createReplyHandlers(controller.updateMessages, shared.record)}
    />
  );
}

/** The list's rows, from each conversation's latest summary. */
export function useConversationRows(samples: readonly AgentConversationSample[]) {
  const [summaries, setSummaries] = useState<Record<string, AgentConversationSummary>>({});
  const [onSummary] = useState(
    () => (id: string, summary: AgentConversationSummary) =>
      setSummaries((current) => ({ ...current, [id]: summary })),
  );
  const rows = samples.map((sample) => {
    const summary = summaries[sample.id];
    return {
      id: sample.id,
      title: summary?.title ?? sample.title,
      lastMessage: summary?.lastMessage,
      time: summary?.time,
      activity: summary?.isWorking ? 'Working' : undefined,
    };
  });
  return { rows, onSummary };
}
