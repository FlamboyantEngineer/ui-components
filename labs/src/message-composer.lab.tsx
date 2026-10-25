import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/chat-transcript.js';
import {
  createTriggerCompletions,
  type Completion,
} from '../../src/components/completion-list/completion-list.js';

import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['empty', 'draft', 'pending', 'stoppable', 'disabled'] as const;
const parts = ['text only', 'attachments and tools'] as const;

const people: Completion[] = [
  { label: 'Maria Santos', description: 'Design', insertText: '@Maria ', kind: 'person' },
  { label: 'Jon Berg', description: 'Field research', insertText: '@Jon ', kind: 'person' },
  { label: 'Lena Ortiz', description: 'Quality', insertText: '@Lena ', kind: 'person' },
];

const mentions = createTriggerCompletions([
  {
    character: '@',
    getCompletions: (query) =>
      people.filter(({ label }) => label.toLowerCase().includes(query.toLowerCase())),
  },
]);

function Attachment({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <Button
      size="sm"
      variant="chip"
      endIcon="close"
      onPress={onRemove}
      aria-label={`Remove ${name}`}
    >
      {name}
    </Button>
  );
}

function StateSample({
  state,
  part,
}: {
  state: (typeof states)[number];
  part: (typeof parts)[number];
}) {
  const withParts = part === 'attachments and tools';
  return (
    <MessageComposer
      aria-label={`Message (${state}, ${part})`}
      placeholder="Write a message"
      defaultValue={state === 'empty' ? '' : 'Can we move the review to Friday?'}
      isPending={state === 'pending' || state === 'stoppable'}
      onStop={state === 'stoppable' ? () => undefined : undefined}
      isDisabled={state === 'disabled'}
      attachments={withParts ? <Attachment name="Report.pdf" /> : undefined}
      toolbar={withParts ? <Button icon="plus" label="Attach a file" size="sm" /> : undefined}
      onSubmit={() => undefined}
    />
  );
}

/** Sends into the log below, with mentions, attachments and a Ctrl+Enter option. */
function Composing() {
  const [sent, setSent] = useState<Array<{ id: number; text: string; files: string[] }>>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [modifier, setModifier] = useState(false);
  return (
    <>
      <div style={{ height: 200 }}>
        <ChatTranscript aria-label="Sent messages" emptyState="Nothing sent yet.">
          {sent.map((message) => (
            <ChatMessage key={message.id} origin="sent" data-lab-sent={message.id}>
              {message.text}
              {message.files.length > 0 ? ` (${message.files.join(', ')})` : null}
            </ChatMessage>
          ))}
        </ChatTranscript>
      </div>
      <MessageComposer
        placeholder="Write a message, @ to mention"
        submitShortcut={modifier ? 'Ctrl+Enter' : 'Enter'}
        completions={mentions}
        renderCompletion={(person) => (
          <UserIdentity name={person.label} description={person.description} size="sm" />
        )}
        allowsEmptySubmit={files.length > 0}
        attachments={
          files.length > 0
            ? files.map((name) => (
                <Attachment
                  key={name}
                  name={name}
                  onRemove={() => setFiles((list) => list.filter((file) => file !== name))}
                />
              ))
            : undefined
        }
        toolbar={
          <>
            <Button
              icon="plus"
              label="Attach a file"
              size="sm"
              onPress={() => setFiles((list) => [...list, `Photo ${list.length + 1}.png`])}
            />
            <Button size="sm" variant="ghost" onPress={() => setModifier((value) => !value)}>
              {modifier ? 'Send with Ctrl+Enter' : 'Send with Enter'}
            </Button>
          </>
        }
        onSubmit={(text) => {
          setSent((list) => [...list, { id: list.length + 1, text, files }]);
          setFiles([]);
        }}
        data-lab-composer="live"
      />
    </>
  );
}

/** A reply that streams after each message; Stop ends it early. */
function Replying() {
  const [isPending, setIsPending] = useState(false);
  const [stops, setStops] = useState(0);
  return (
    <>
      <MessageComposer
        aria-label="Question"
        isPending={isPending}
        onStop={() => {
          setIsPending(false);
          setStops((count) => count + 1);
        }}
        onSubmit={() => setIsPending(true)}
        data-lab-composer="reply"
      />
      <p>
        Stopped replies: <output data-lab-output="stops">{stops}</output>
      </p>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Empty and with a draft; pending (the spinner), pending with Stop, and disabled; with attachments above and tools beside the send button."
    >
      <StateMatrix
        axes={{ state: states, part: parts }}
        render={({ state, part }) => <StateSample state={state} part={part} />}
      />
    </LabSection>
    <LabSection
      title="Composing"
      description="Enter sends and Shift+Enter breaks the line (or Ctrl+Enter sends); @ mentions a person; attachments alone can be sent. The text area grows up to eight rows."
    >
      <Composing />
    </LabSection>
    <LabSection
      title="Stopping a reply"
      description="Sending starts a pending reply: the same button turns into Stop and keeps keyboard focus."
    >
      <Replying />
    </LabSection>
  </>,
);
