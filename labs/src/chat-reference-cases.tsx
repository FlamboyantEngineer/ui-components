// The Chat lab's record references: the "+" menu inserts reference chips, the host receives their
// ids with the message, and the transcript, the drafts of two conversations and a refused send keep
// them.

import { useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Stack } from '../../src/components/layout/layout.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  assistantPeople,
  nextLabId,
  nowIso,
  plannerId,
  readerId,
  sentMessage,
} from './chat-samples.js';
import { LabSection } from './chrome/index.js';
import { getLabReference, labRecords, referenceMenuItems } from './reference-samples.js';

const conversations = [
  { value: 'lisbon', label: 'Lisbon trip' },
  { value: 'porto', label: 'Porto trip' },
];

const [trip, note] = labRecords;

const firstText = 'Please review TRIP-4 and NOTE-12 first';

/** A reference token over a record's label in `text`, as the composer sends it. */
function referenceOver(text: string, record: (typeof labRecords)[number]): ChatTextToken {
  const start = text.indexOf(record.label);
  return {
    start,
    end: start + record.label.length,
    kind: 'reference',
    id: record.id,
    label: record.label,
    recordType: record.recordType,
  };
}

const initialMessages: Record<string, readonly ChatMessageData[]> = {
  lisbon: [
    {
      id: 'reference-question',
      authorId: readerId,
      createdAt: '2026-04-20T10:02:00',
      parts: [
        {
          type: 'text',
          text: firstText,
          tokens: [referenceOver(firstText, trip!), referenceOver(firstText, note!)],
        },
      ],
    },
    {
      id: 'reference-answer',
      authorId: plannerId,
      createdAt: '2026-04-20T10:02:20',
      parts: [{ type: 'text', text: 'Both look good; the packing list misses a rain jacket.' }],
    },
  ],
  porto: [],
};

const referenceMenu = {
  sections: [{ id: 'references', title: 'References', items: referenceMenuItems }],
};

/** Waits like a request to a server, then accepts or refuses. */
function request(refuse: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (refuse ? reject(new Error('Service unavailable')) : resolve()), 700);
  });
}

/** The ids the host received, for the lab's log. */
function describeReferences(tokens: readonly ChatTextToken[]): string {
  const ids = tokens.filter((token) => token.kind === 'reference').map((token) => token.id);
  return ids.length === 0 ? 'no references' : ids.join(', ');
}

/**
 * Two conversations with an assistant whose host accepts each message after a moment, or refuses
 * it while Refuse messages is on; the log shows the reference ids each accepted message carried.
 */
function ReferenceDemo() {
  const [conversation, setConversation] = useState('lisbon');
  const [messages, setMessages] = useState(initialMessages);
  const [refuses, setRefuses] = useState(false);
  const [log, setLog] = useState('');
  const accept = async (scope: string, text: string, tokens: readonly ChatTextToken[] = []) => {
    await request(refuses);
    setLog(`${scope}: ${describeReferences(tokens)}`);
    setMessages((all) => ({
      ...all,
      [scope]: [
        ...(all[scope] ?? []),
        sentMessage(text, tokens),
        {
          id: nextLabId('reference-reply'),
          authorId: plannerId,
          createdAt: nowIso(),
          parts: [{ type: 'text', text: 'Looking at those now.' }],
        },
      ],
    }));
  };
  return (
    <Stack space="sm" data-lab-demo="references">
      <SegmentedChoice
        aria-label="Conversation"
        options={conversations}
        value={conversation}
        onChange={(value) => {
          if (value) setConversation(value);
        }}
      />
      <Checkbox isSelected={refuses} onChange={setRefuses}>
        Refuse messages
      </Checkbox>
      <div style={{ height: 420, maxWidth: 560 }}>
        <Chat
          messages={messages[conversation] ?? []}
          participants={assistantPeople}
          currentUserId={readerId}
          conversationId={`lab-references-${conversation}`}
          title="Trip planner"
          placeholder="Add references from the + menu"
          composerMenu={referenceMenu}
          getReference={getLabReference}
          onSend={(text, tokens) => accept(conversation, text, tokens)}
          onReply={(_id, text, tokens) => accept(conversation, text, tokens)}
          onSendError={() => setLog('Not sent: the draft and its references are kept.')}
        />
      </div>
      <p role="status" data-lab-output="references">
        {log}
      </p>
    </Stack>
  );
}

export function ChatReferenceCases() {
  return (
    <LabSection
      title="Record references"
      description="The + menu inserts references to records as chips (a missing and a restricted record among them), alone or among words; the host's getReference lookup draws each chip's name, link and preview from its id, in the composer and in the transcript. The host receives the references' ids with the message, shown below. Each conversation keeps its own draft with its chips; with Refuse messages on, a sent message stays in the composer with its chips, and switching conversations while a message waits leaves the other draft alone."
    >
      <ReferenceDemo />
    </LabSection>
  );
}
