// The Chat lab's sidebar "+" buttons: a host inserting record references into the shown conversation's draft
// through the composer handle, skipping records the draft holds, in a new chat and after a reply.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat, type ChatComposerHandle, type ChatDraft } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatTextToken } from '../../src/components/chat-parts/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  assistantPeople,
  nextLabId,
  nowIso,
  plannerId,
  readerId,
  sentMessage,
  textMessage,
} from './chat-samples.js';
import { LabSection } from './chrome/index.js';
import { getLabReference, labRecords } from './reference-samples.js';

/** The records the sidebar lists: two available ones and a missing one. */
const records = labRecords.slice(0, 3);

const conversations = [
  { value: 'lab-records-new', label: 'New chat' },
  { value: 'lab-records-existing', label: 'Existing conversation' },
];

const initialMessages: Readonly<Record<string, readonly ChatMessageData[]>> = {
  'lab-records-new': [],
  'lab-records-existing': [
    textMessage({
      id: 'records-question',
      time: '2026-04-20T09:40:00',
      authorId: readerId,
      text: 'What is still open for the trip?',
    }),
    textMessage({
      id: 'records-answer',
      time: '2026-04-20T09:40:20',
      authorId: plannerId,
      text: 'The day plan and the packing list. Add the records you want me to look at.',
    }),
  ],
};

/** Waits like a request to a server, then accepts or refuses. */
function request(refuse: boolean) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => (refuse ? reject(new Error('Service unavailable')) : resolve()), 700);
  });
}

/** The labels of the records a message refers to, for the reply. */
function listRecords(tokens: readonly ChatTextToken[]) {
  const labels = tokens.filter((token) => token.kind === 'reference').map((token) => token.label);
  return labels.length > 0 ? labels.join(', ') : 'no record';
}

/** Each conversation's messages, and a host that accepts a message after a moment and replies. */
function useRecordsHost() {
  const [messages, setMessages] = useState(initialMessages);
  const [refuseNext, setRefuseNext] = useState(false);
  const send = async (conversationId: string, text: string, tokens: readonly ChatTextToken[]) => {
    await request(refuseNext);
    const reply: ChatMessageData = {
      id: nextLabId('records-reply'),
      authorId: plannerId,
      createdAt: nowIso(),
      parts: [{ type: 'text', text: `Looking at ${listRecords(tokens)}.` }],
    };
    setMessages((all) => ({
      ...all,
      [conversationId]: [...(all[conversationId] ?? []), sentMessage(text, tokens), reply],
    }));
  };
  return { messages, refuseNext, setRefuseNext, send };
}

/**
 * A sidebar of records beside the chat: each "+" adds its record to the shown conversation's
 * draft at the saved caret, or says why it did not.
 */
function RecordsDemo() {
  const handle = useRef<ChatComposerHandle>(null);
  const host = useRecordsHost();
  const [conversationId, setConversationId] = useState(conversations[0]?.value ?? '');
  const [drafts, setDrafts] = useState<Readonly<Record<string, readonly string[]>>>({});
  const [status, setStatus] = useState('');
  const inDraft = drafts[conversationId] ?? [];
  const onDraftChange = (draft: ChatDraft) => {
    const ids = draft.tokens.map((token) => token.id);
    setDrafts((all) => ({ ...all, [draft.conversationId ?? '']: ids }));
  };
  const add = (record: (typeof labRecords)[number]) => {
    if (inDraft.includes(record.id)) {
      setStatus(`${record.label} is already in the message.`);
      return;
    }
    const { id, label, recordType } = record;
    const token = { kind: 'reference', id, label, recordType } as const;
    const result = handle.current?.insertToken(token, { conversationId }) ?? 'unavailable';
    setStatus(result === 'inserted' ? '' : `${record.label} was not added: ${result}.`);
  };
  return (
    <Stack space="sm" data-lab-demo="records">
      <Cluster space="md">
        <SegmentedChoice
          aria-label="Conversation"
          options={conversations}
          value={conversationId}
          onChange={(value) => setConversationId(value ?? conversationId)}
        />
        <Checkbox isSelected={host.refuseNext} onChange={host.setRefuseNext}>
          Refuse the next message
        </Checkbox>
      </Cluster>
      <Cluster space="md" align="start">
        <ul aria-label="Records" data-lab-output="records">
          {records.map((record) => (
            <li key={record.id}>
              {record.name ?? record.label}{' '}
              <Button
                icon="plus"
                size="sm"
                label={`Add ${record.label} to the message`}
                onPress={() => add(record)}
              />
            </li>
          ))}
        </ul>
        <div style={{ height: 420, width: 460 }}>
          <Chat
            messages={host.messages[conversationId] ?? []}
            participants={assistantPeople}
            currentUserId={readerId}
            conversationId={conversationId}
            title="Trip planner"
            getReference={getLabReference}
            composerHandleRef={handle}
            onDraftChange={onDraftChange}
            onSend={(text, tokens = []) => host.send(conversationId, text, tokens)}
            onSendError={() => setStatus('Not sent: Service unavailable. The message is kept.')}
          />
        </div>
      </Cluster>
      <p role="status" data-lab-output="records-status">
        {status}
      </p>
    </Stack>
  );
}

export function ChatSidebarCases() {
  return (
    <LabSection
      title="Records from a sidebar"
      description="A host's sidebar beside the full Chat. Each + inserts its record as a reference chip into the shown conversation's draft through composerHandleRef, at the caret the composer had before focus left (else at the end), keeping the typed text, and focuses the composer; Ctrl+Z takes the insertion back. The host follows the draft through onDraftChange and skips a record the draft already holds; removing the pill lets + add it again. Records can be sent alone or with text, in a new chat or after the assistant's reply, and each conversation keeps its own draft. While a sent message waits for the host, + reports submitting and changes nothing; a refused message keeps its text and records."
    >
      <RecordsDemo />
    </LabSection>
  );
}
