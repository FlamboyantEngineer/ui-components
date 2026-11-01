import { CloseGlyph } from '../../src/core/glyphs.js';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/chat-transcript.js';
import {
  RichMessageComposer,
  type MessageComposerCommand,
  type MessageComposerMention,
  type MessageComposerMessage,
} from '../../src/components/message-composer/rich/index.js';
import {
  MessageComposerAttachButton,
  MessageComposerEmojiButton,
} from '../../src/components/message-composer/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

const contents = ['empty', 'pills', 'code block'] as const;
const statuses = ['ready', 'pending', 'disabled', 'editing'] as const;

export const labPeople: MessageComposerMention[] = [
  { id: 'maria', label: 'Maria Santos', description: 'Design', colorKey: 'maria' },
  { id: 'jon', label: 'Jon Berg', description: 'Field research', src: samplePicture },
  { id: 'lena', label: 'Lena Ortiz', description: 'Quality', colorKey: 'lena' },
];

const labCommands: MessageComposerCommand[] = [
  { id: 'summarize', label: 'summarize', description: 'Summarize the conversation' },
  { id: 'translate', label: 'translate', description: 'Translate the last reply' },
  { id: 'itinerary', label: 'itinerary', description: 'Draft a day-by-day plan' },
];

const samples: Record<(typeof contents)[number], MessageComposerMessage> = {
  empty: { text: '', tokens: [] },
  pills: {
    text: 'Ask @Maria Santos to /summarize the notes',
    tokens: [
      { start: 4, end: 17, kind: 'mention', id: 'maria', label: 'Maria Santos' },
      { start: 21, end: 31, kind: 'command', id: 'summarize', label: 'summarize' },
    ],
  },
  // The code holds a fence of its own, so the block is fenced with four backticks.
  'code block': {
    text: 'Try this:\n````md\nconst total = items.length;\n```\n````',
    tokens: [],
  },
};

/** A file attached to the message, as a chip that removes it. */
export function AttachmentChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <Button
      size="sm"
      variant="chip"
      endIcon={CloseGlyph}
      onPress={onRemove}
      aria-label={`Remove ${name}`}
    >
      {name}
    </Button>
  );
}

/** The line above the composer: what it replies to or edits, with a way out. */
export function ComposerBanner({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <>
      <span>{children}</span>
      {onClose ? <Button icon={CloseGlyph} label="Close" size="xs" onPress={onClose} /> : null}
    </>
  );
}

/** A sent message's text and the pills it carried. */
export function SentMessage({ message }: { message: MessageComposerMessage }) {
  return (
    <>
      {message.text}
      {message.tokens.length > 0 ? (
        <small data-lab-tokens>
          {' '}
          (
          {message.tokens
            .map((token) => `${token.kind} ${token.id} ${token.start}–${token.end}`)
            .join(', ')}
          )
        </small>
      ) : null}
    </>
  );
}

function RichStateSample({
  content,
  status,
}: {
  content: (typeof contents)[number];
  status: (typeof statuses)[number];
}) {
  const isEditing = status === 'editing';
  return (
    <RichMessageComposer
      aria-label={`Rich message (${content}, ${status})`}
      placeholder="Ask anything, / for commands"
      defaultValue={isEditing ? undefined : samples[content]}
      editValue={isEditing ? samples[content] : undefined}
      banner={isEditing ? <ComposerBanner>Editing your message</ComposerBanner> : undefined}
      isPending={status === 'pending'}
      onStop={() => undefined}
      isDisabled={status === 'disabled'}
      mentions={labPeople}
      commands={labCommands}
      onCancel={() => undefined}
      onSubmit={() => undefined}
    />
  );
}

/** An assistant chat: commands, files, emoji, recall of earlier prompts and a reply to stop. */
function AssistantChat() {
  const [sent, setSent] = useState<Array<MessageComposerMessage & { files: string[] }>>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  useEffect(() => {
    if (!isPending) return undefined;
    const timer = setTimeout(() => setIsPending(false), 1500);
    return () => clearTimeout(timer);
  }, [isPending]);
  return (
    <>
      <div style={{ height: 220 }}>
        <ChatTranscript aria-label="Prompts sent" emptyState="Nothing sent yet.">
          {sent.map((message, index) => (
            <ChatMessage key={index} origin="sent" data-lab-sent={index + 1}>
              <SentMessage message={message} />
              {message.files.length > 0 ? ` [${message.files.join(', ')}]` : null}
            </ChatMessage>
          ))}
        </ChatTranscript>
      </div>
      <RichMessageComposer
        aria-label="Prompt"
        placeholder="Ask the travel planner, / for commands"
        commands={labCommands}
        mentions={labPeople}
        history={sent.map((message) => message.text)}
        isPending={isPending}
        onStop={() => setIsPending(false)}
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
        startControls={
          <>
            <MessageComposerAttachButton />
            <MessageComposerEmojiButton />
          </>
        }
        onSubmit={(message) => {
          setSent((list) => [...list, { ...message, files }]);
          setFiles([]);
          setIsPending(true);
        }}
        data-lab-composer="assistant"
      />
    </>
  );
}

/** The rich composer's state matrix and an assistant chat that uses it. */
export function RichComposerSections() {
  return (
    <>
      <LabSection
        title="Rich states"
        description="The rich composer (from the message-composer/rich entry point) empty with its placeholder, with a mention and a command as pills, and with a code block that holds a fence of its own; ready, pending with Stop, disabled, and editing."
      >
        <StateMatrix
          axes={{ content: contents, status: statuses }}
          render={({ content, status }) => <RichStateSample content={content} status={status} />}
        />
      </LabSection>
      <LabSection
        title="Assistant chat"
        description="Type / for a command or @ for a person: the arrows choose, Enter or Tab inserts a pill, Backspace removes it whole. Three backticks open a code block where Enter adds lines; Ctrl+Enter sends, or leave the block with the Down arrow. Ctrl+B and Ctrl+I wrap the selection in Markdown. Paste keeps spacing; drop, paste or attach files; Up recalls earlier prompts. Sending starts a reply you can stop."
      >
        <AssistantChat />
      </LabSection>
    </>
  );
}
