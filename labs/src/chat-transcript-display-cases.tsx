import {
  ChatMessage,
  type ChatMessageOrigin,
  type ChatMessageTimePlacement,
  type ChatMessageVariant,
} from '../../src/components/chat-transcript/index.js';
import { at, getNow, helper, maria } from './chat-transcript-message-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const variants = ['bubble', 'plain'] as const satisfies readonly ChatMessageVariant[];
const authors = ['avatar and name', 'avatar only', 'name only', 'neither'] as const;
const times = [
  'header',
  'footer',
  'tooltip',
  'none',
] as const satisfies readonly ChatMessageTimePlacement[];

function DisplayMessage({
  variant,
  author,
  time,
  from,
}: {
  variant: ChatMessageVariant;
  author: (typeof authors)[number];
  time: ChatMessageTimePlacement;
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
      timePlacement={time}
    >
      The ridge trail reopened this morning.
    </ChatMessage>
  );
}

/** The message display cases of the Chat Transcript lab: avatar, name, time and background. */
export function ChatTranscriptDisplayCases() {
  return (
    <LabSection
      title="Avatar, name, time and background"
      description="A message in a bubble or as plain text, with or without its author's avatar and name, and its time in the header, in the footer (shown with the actions while the message is hovered or holds focus, its line kept meanwhile; Footer time line shows it collapsing), in a tooltip over the message while it is hovered or holds focus, or left out. A plain received message takes the whole width; the accessible name keeps the author and the time either way."
    >
      <StateMatrix
        axes={{ variant: variants, author: authors, time: times, from: ['received', 'sent'] }}
        render={({ variant, author, time, from }) => (
          <DisplayMessage variant={variant} author={author} time={time} from={from} />
        )}
      />
    </LabSection>
  );
}
