// The Chat lab's chrome: the header with participants, search and host controls, and a ChatList
// beside the chat that switches conversations, each with its own draft.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat } from '../../src/components/chat/index.js';
import { ChatList, type ChatConversation } from '../../src/components/chat-list/index.js';
import type { ChatMessageData, ChatParticipant } from '../../src/components/chat-parts/index.js';
import { requireDefined } from '../../src/utils/require-defined.js';
import { usePeopleHost } from './chat-people-host.js';
import { ana, ben, getLabNow, mia, reader, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

interface LabConversation {
  id: string;
  title: string;
  participants: ChatParticipant[];
  messages: ChatMessageData[];
}

const conversations: LabConversation[] = [
  {
    id: 'chrome-ana',
    title: 'Ana Lopez',
    participants: [reader, ana],
    messages: [
      textMessage({
        id: 'chrome-ana-1',
        authorId: 'ana',
        time: '2026-04-20T09:40:00',
        text: 'Did you find the tickets?',
      }),
      textMessage({
        id: 'chrome-ana-2',
        authorId: readerId,
        time: '2026-04-20T09:42:00',
        text: 'Yes, two for the 10:15 boat.',
        delivery: 'read',
      }),
    ],
  },
  {
    id: 'chrome-team',
    title: 'Weekend team',
    participants: [reader, ana, ben, mia],
    messages: [
      textMessage({
        id: 'chrome-team-1',
        authorId: 'ben',
        time: '2026-04-20T08:00:00',
        text: 'Bikes or the bus to the coast?',
      }),
      textMessage({
        id: 'chrome-team-2',
        authorId: 'mia',
        time: '2026-04-20T08:03:00',
        text: 'Bikes, if the wind is calm.',
      }),
      textMessage({
        id: 'chrome-team-3',
        authorId: 'ana',
        time: '2026-04-20T08:05:00',
        text: 'The wind is calm until noon.',
      }),
    ],
  },
  {
    id: 'chrome-ben',
    title: 'Ben Carter',
    participants: [reader, ben],
    messages: [
      textMessage({
        id: 'chrome-ben-1',
        authorId: 'ben',
        time: '2026-04-19T16:00:00',
        text: 'Thanks for the map!',
      }),
    ],
  },
];

/** A row of the conversation list for a lab conversation. */
function toListRow(conversation: LabConversation): ChatConversation {
  const last = conversation.messages.at(-1);
  const text = last?.parts[0]?.type === 'text' ? last.parts[0].text : undefined;
  return {
    id: conversation.id,
    title: conversation.title,
    lastMessage: text,
    time: last?.createdAt,
    participants: conversation.participants
      .filter((participant) => participant.id !== readerId)
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        presence: participant.status,
        presenceLabel: participant.statusLabel,
      })),
  };
}

/** One conversation's chat; mounted per conversation, so each keeps its own messages. */
function ConversationChat({ conversation }: { conversation: LabConversation }) {
  const host = usePeopleHost({ initialMessages: conversation.messages });
  const [isMuted, setMuted] = useState(false);
  return (
    <Chat
      {...host}
      participants={conversation.participants}
      currentUserId={readerId}
      conversationId={conversation.id}
      title={conversation.title}
      getNow={getLabNow}
      showSearch
      headerActions={
        <Button size="sm" variant="ghost" isSelected={isMuted} onChange={setMuted}>
          {isMuted ? 'Muted' : 'Mute'}
        </Button>
      }
    />
  );
}

function ChromeDemo() {
  const [selectedId, setSelectedId] = useState('chrome-team');
  const selected =
    conversations.find((entry) => entry.id === selectedId) ?? requireDefined(conversations[0]);
  return (
    <div
      data-lab-demo="chrome"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: 16 }}
    >
      <div style={{ height: 480 }}>
        <ChatList
          conversations={conversations.map(toListRow)}
          selectedId={selectedId}
          onSelectionChange={setSelectedId}
          getNow={getLabNow}
        />
      </div>
      <div style={{ height: 480 }}>
        <ConversationChat key={selected.id} conversation={selected} />
      </div>
    </div>
  );
}

export function ChatChromeCases() {
  return (
    <LabSection
      title="Header, search and conversation list"
      description="The header shows the other participants with their presence (one avatar, or a stack that lists everyone), the title, who is typing, the search button and the host's controls (Mute). The search marks the matches in the messages and steps through them. The ChatList beside the chat switches conversations; each keeps its own draft in the composer."
    >
      <ChromeDemo />
    </LabSection>
  );
}
