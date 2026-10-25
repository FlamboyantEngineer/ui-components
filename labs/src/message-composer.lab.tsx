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
import {
  AttachmentChip,
  ComposerBanner,
  RichComposerSections,
} from './message-composer-rich-cases.js';
import { TeamChatSection } from './message-composer-team-cases.js';

const states = ['empty', 'draft', 'pending', 'stoppable', 'disabled', 'editing'] as const;
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

function StateSample({
  state,
  part,
}: {
  state: (typeof states)[number];
  part: (typeof parts)[number];
}) {
  const withParts = part === 'attachments and tools';
  const isEditing = state === 'editing';
  return (
    <MessageComposer
      aria-label={`Message (${state}, ${part})`}
      placeholder="Write a message"
      defaultValue={state === 'empty' ? '' : 'Can we move the review to Friday?'}
      editValue={isEditing ? 'The review is on Thursday.' : undefined}
      isPending={state === 'pending' || state === 'stoppable'}
      onStop={state === 'stoppable' ? () => undefined : undefined}
      isDisabled={state === 'disabled'}
      banner={
        isEditing ? (
          <ComposerBanner>Editing your message</ComposerBanner>
        ) : withParts ? (
          <ComposerBanner>Replying to Maria Santos</ComposerBanner>
        ) : undefined
      }
      attachments={withParts ? <AttachmentChip name="Report.pdf" /> : undefined}
      onAttach={withParts ? () => undefined : undefined}
      showEmojiPicker={withParts}
      toolbar={
        withParts ? (
          <Button size="sm" variant="ghost">
            Tone
          </Button>
        ) : undefined
      }
      onCancel={() => undefined}
      onSubmit={() => undefined}
    />
  );
}

/** Sends into the log below, with mentions, attached files, emoji and a Ctrl+Enter option. */
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
                <AttachmentChip
                  key={name}
                  name={name}
                  onRemove={() => setFiles((list) => list.filter((file) => file !== name))}
                />
              ))
            : undefined
        }
        onAttach={(added) => setFiles((list) => [...list, ...added.map((file) => file.name)])}
        showEmojiPicker
        toolbar={
          <Button size="sm" variant="ghost" onPress={() => setModifier((value) => !value)}>
            {modifier ? 'Send with Ctrl+Enter' : 'Send with Enter'}
          </Button>
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

/** Sending while the reply runs queues the message; the button is Stop only while empty. */
function Queueing() {
  const [isPending, setIsPending] = useState(false);
  const [queued, setQueued] = useState<string[]>([]);
  return (
    <>
      <MessageComposer
        aria-label="Follow-up"
        placeholder="Ask, then ask again while the reply runs"
        isPending={isPending}
        allowsPendingSubmit
        onStop={() => setIsPending(false)}
        onSubmit={(text) => {
          if (isPending) setQueued((list) => [...list, text]);
          else setIsPending(true);
        }}
        data-lab-composer="queue"
      />
      <p>
        Queued: <output data-lab-output="queued">{queued.join(' · ') || 'nothing'}</output>
      </p>
    </>
  );
}

/** Recalls earlier prompts with the arrows, as an assistant chat does. */
function Recalling() {
  const [history, setHistory] = useState(['Summarize the field notes', 'List the open questions']);
  return (
    <MessageComposer
      aria-label="Prompt"
      placeholder="Ask, or press Up for an earlier prompt"
      history={history}
      onSubmit={(text) => setHistory((list) => [...list, text])}
      data-lab-composer="history"
    />
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Empty and with a draft; pending (the spinner), pending with Stop, disabled, and editing a message (Save and Cancel); with a banner, attachments above, and the attach, emoji and caller tools beside the button."
    >
      <StateMatrix
        axes={{ state: states, part: parts }}
        render={({ state, part }) => <StateSample state={state} part={part} />}
      />
    </LabSection>
    <LabSection
      title="Composing"
      description="Enter sends and Shift+Enter breaks the line (or Ctrl+Enter sends, with either chord); @ mentions a person; files come from the attach button, a drop on the composer or a paste, and alone can be sent; the emoji button inserts at the caret. The text area grows up to eight rows."
    >
      <Composing />
    </LabSection>
    <LabSection
      title="Stopping a reply"
      description="Sending starts a pending reply: the same button turns into Stop and keeps keyboard focus. With allowsPendingSubmit (the second composer), Enter still sends while the reply runs, for a host that queues the message; the button is Send while there is text and Stop while there is none."
    >
      <Replying />
      <Queueing />
    </LabSection>
    <LabSection
      title="Recalling earlier prompts"
      description="In an empty composer Up shows the newest earlier prompt and each further Up an older one; Down goes back, then empties the composer. Once you change a recalled prompt the arrows move the caret again."
    >
      <Recalling />
    </LabSection>
    <RichComposerSections />
    <TeamChatSection />
    <LabSection
      title="Touch screens"
      description="On a touch screen (a coarse pointer) the on-screen keyboard's Enter breaks the line, so a message can hold several lines, and the send button sends; Ctrl+Enter still sends from a hardware keyboard. The send button's tooltip shows the chord in effect. Open this lab on a phone or tablet to try it."
    >
      <MessageComposer
        aria-label="Message on a touch screen"
        placeholder="Enter breaks the line on a touch screen"
        onSubmit={() => undefined}
        data-lab-composer="touch"
      />
    </LabSection>
  </>,
);
