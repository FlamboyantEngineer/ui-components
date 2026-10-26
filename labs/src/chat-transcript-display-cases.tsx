import {
  ChatMessage,
  type ChatMessageOrigin,
  type ChatMessageVariant,
} from '../../src/components/chat-transcript/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { at, getNow, helper, maria } from './chat-transcript-message-samples.js';

const variants = ['bubble', 'plain'] as const satisfies readonly ChatMessageVariant[];
const authors = ['avatar and name', 'avatar only', 'name only', 'neither'] as const;

function DisplayMessage({
  variant,
  author,
  from,
}: {
  variant: ChatMessageVariant;
  author: (typeof authors)[number];
  from: Exclude<ChatMessageOrigin, 'system'>;
}) {
  return (
    <ChatMessage
      origin={from}
      author={from === 'sent' ? maria : helper}
      time={at(20, 9, 50)}
      getNow={getNow}
      variant={variant}
      showAvatar={author === 'avatar and name' || author === 'avatar only'}
      showAuthorName={author === 'avatar and name' || author === 'name only'}
    >
      The ridge trail reopened this morning.
    </ChatMessage>
  );
}

/** The message display cases of the Chat Transcript lab: avatar, name and background. */
export function ChatTranscriptDisplayCases() {
  return (
    <LabSection
      title="Avatar, name and background"
      description="A message in a bubble or as plain text, with or without its author's avatar and name. A plain received message takes the whole width; the accessible name keeps the author either way."
    >
      <StateMatrix
        axes={{ variant: variants, author: authors, from: ['received', 'sent'] }}
        render={({ variant, author, from }) => (
          <DisplayMessage variant={variant} author={author} from={from} />
        )}
      />
    </LabSection>
  );
}
