// The Chat Transcript lab's conversation switch: one transcript showing two conversations whose
// messages share ids and a date, each starting over with its own paging and read reports.

import { useState } from 'react';
import {
  ChatDateSeparator,
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';

const conversations = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'garden', label: 'Garden' },
];

const lines: Readonly<Record<string, readonly [string, string]>> = {
  kitchen: ['The tap still drips.', 'I will order a new washer.'],
  garden: ['The hedge needs trimming.', 'Saturday morning works.'],
};

/** One transcript that switches between two conversations with the same message ids. */
function ConversationSwitchCase() {
  const [conversationId, setConversationId] = useState('kitchen');
  const [requests, setRequests] = useState<Readonly<Record<string, number>>>({});
  const [lastRead, setLastRead] = useState('none');
  const [first, second] = lines[conversationId] ?? ['', ''];
  return (
    <div data-lab-demo="conversation-switch">
      <SegmentedChoice
        aria-label="Conversation"
        options={conversations}
        value={conversationId}
        onChange={(value) => setConversationId(value ?? conversationId)}
      />
      <div style={{ height: 260 }}>
        <ChatTranscript
          aria-label="Shared transcript"
          conversationId={conversationId}
          hasOlder
          onLoadOlder={() =>
            setRequests((all) => ({ ...all, [conversationId]: (all[conversationId] ?? 0) + 1 }))
          }
          onRead={(id) => setLastRead(`${conversationId} ${id}`)}
        >
          <ChatDateSeparator key="day" date="2026-04-20" />
          <ChatMessage key="m1" id="m1">
            {first}
          </ChatMessage>
          <ChatMessage key="m2" id="m2">
            {second}
          </ChatMessage>
        </ChatTranscript>
      </div>
      <output data-lab-output="older-requests">
        Older history asked for: kitchen {requests.kitchen ?? 0}, garden {requests.garden ?? 0}
      </output>{' '}
      <output data-lab-output="last-read">Last read: {lastRead}</output>
    </div>
  );
}

export function ChatTranscriptConversationCases() {
  return (
    <LabSection
      title="Switching conversations"
      description="One transcript shows two conversations whose messages share ids and a date. Switching starts it over with conversationId: each conversation asks for its older history once and reports its own newest message read."
    >
      <ConversationSwitchCase />
    </LabSection>
  );
}
