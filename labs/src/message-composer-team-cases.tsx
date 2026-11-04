import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatMessage,
  ChatTranscript,
} from '../../src/components/chat-transcript/chat-transcript.js';
import { MessageComposerEmojiButton } from '../../src/components/message-composer/index.js';
import {
  type MessageComposerMessage,
  RichMessageComposer,
} from '../../src/components/message-composer/rich/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { ComposerBanner, labPeople, SentMessage } from './message-composer-rich-cases.js';

interface TeamMessage extends MessageComposerMessage {
  id: number;
  isEdited: boolean;
  replyTo?: string | undefined;
}

const conversations = [
  { value: 'design', label: 'Design team' },
  { value: 'jon', label: 'Jon Berg' },
];

/** What the composer is busy with: editing one of the reader's messages, or replying to one. */
type Focus = { kind: 'edit'; id: number } | { kind: 'reply'; id: number } | null;

function MessageActions({
  message,
  onFocus,
}: {
  message: TeamMessage;
  onFocus: (focus: Focus) => void;
}) {
  return (
    <>
      <Button size="sm" variant="ghost" onPress={() => onFocus({ kind: 'edit', id: message.id })}>
        Edit
      </Button>
      <Button size="sm" variant="ghost" onPress={() => onFocus({ kind: 'reply', id: message.id })}>
        Reply
      </Button>
    </>
  );
}

/**
 * A team chat: mentions as pills, Up in an empty composer edits your last message, Edit and
 * Reply put a banner above the composer, and each conversation keeps its own draft.
 */
function TeamChat() {
  const [conversation, setConversation] = useState('design');
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [focus, setFocus] = useState<Focus>(null);
  const target = messages.find((message) => message.id === focus?.id);
  const editing = focus?.kind === 'edit' ? target : undefined;
  const send = (message: MessageComposerMessage) => {
    if (editing) {
      setMessages((list) =>
        list.map((item) =>
          item.id === editing.id ? { ...item, ...message, isEdited: true } : item,
        ),
      );
    } else {
      const replyTo = focus?.kind === 'reply' ? target?.text : undefined;
      setMessages((list) => [
        ...list,
        { ...message, id: list.length + 1, isEdited: false, replyTo },
      ]);
    }
    setFocus(null);
  };
  return (
    <>
      <SegmentedChoice
        aria-label="Conversation"
        options={conversations}
        value={conversation}
        onChange={(value) => {
          if (value) setConversation(value);
        }}
      />
      <div style={{ height: 200 }}>
        <ChatTranscript aria-label="Team messages" emptyState="No messages yet.">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              origin="sent"
              data-lab-team={message.id}
              actions={<MessageActions message={message} onFocus={setFocus} />}
            >
              {message.replyTo ? `> ${message.replyTo}\n` : null}
              <SentMessage message={message} />
              {message.isEdited ? ' (edited)' : null}
            </ChatMessage>
          ))}
        </ChatTranscript>
      </div>
      <RichMessageComposer
        aria-label={`Message ${conversations.find((item) => item.value === conversation)?.label}`}
        placeholder="Write to the team, @ to mention"
        mentions={labPeople}
        persistKey={`message-composer-lab:${conversation}`}
        editValue={editing}
        banner={
          focus && target ? (
            <ComposerBanner onClose={() => setFocus(null)}>
              {focus.kind === 'edit' ? 'Editing your message' : `Replying to: ${target.text}`}
            </ComposerBanner>
          ) : undefined
        }
        onCancel={() => setFocus(null)}
        onEditLast={() => {
          const last = messages.at(-1);
          if (last) setFocus({ kind: 'edit', id: last.id });
        }}
        startControls={<MessageComposerEmojiButton />}
        onSubmit={send}
        data-lab-composer="team"
      />
    </>
  );
}

export function TeamChatSection() {
  return (
    <LabSection
      title="Team chat"
      description="Mention people with @. In an empty composer Up edits your last message: Save (Enter) or Cancel (Escape). Edit and Reply put a banner above the composer. Each conversation keeps its own draft, with its pills, in the provider's storage: switch conversations, or reload the page. Storage is written once typing pauses or focus leaves, not on every key press."
    >
      <TeamChat />
    </LabSection>
  );
}
