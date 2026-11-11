import { useRef, useState } from 'react';
import { ChatParts } from '../../src/components/chat-parts/index.js';
import {
  CommentText,
  CommentThread,
  CommentThreadReply,
} from '../../src/components/comment-thread/index.js';
import { MessageComposerEmojiButton } from '../../src/components/message-composer/index.js';
import {
  type MessageComposerMention,
  type MessageComposerMessage,
  RichMessageComposer,
} from '../../src/components/message-composer/rich/index.js';
import { ReactionBar, type ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import { renderSampleCard, sampleMentions } from './comment-mention-samples.js';
import { samplePicture } from './people-samples.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };

/** Who `@` mentions, from the rich composer's mention list. */
const mentionable: MessageComposerMention[] = [
  { id: 'maria', label: 'Maria Santos', colorKey: 'maria' },
  { id: 'jon', label: 'Jon Berg', src: samplePicture },
  { id: 'lena', label: 'Lena Ortiz', colorKey: 'lena' },
];

interface MentionComment {
  id: number;
  author: typeof maria | typeof jon;
  time: string;
  /** The text with its mentions as token ranges, as the rich composer sends it. */
  message: MessageComposerMessage;
  isEdited?: boolean;
  reactions: ReactionEntry[];
}

const opening: MentionComment[] = [
  {
    id: 1,
    author: jon,
    time: '2026-04-20T09:40:00',
    message: {
      text: '@Lena Ortiz can you taste the pear sauce before Friday? 🍐',
      tokens: [{ start: 0, end: 11, kind: 'mention', id: 'lena', label: 'Lena Ortiz' }],
    },
    reactions: [{ emoji: '👍', people: ['Lena Ortiz', 'Maria Santos'] }],
  },
];

/** Toggles the reader's reaction, adding the emoji when it is new, as a host keeping counts would. */
function toggleReaction(reactions: ReactionEntry[], emoji: string, isReacted: boolean) {
  const found = reactions.some((reaction) => reaction.emoji === emoji);
  const list = found ? reactions : [...reactions, { emoji, people: [] }];
  return list.map((reaction) => {
    if (reaction.emoji !== emoji) return reaction;
    const others = (reaction.people ?? []).filter((name) => name !== maria.name);
    return { ...reaction, isReacted, people: isReacted ? [maria.name, ...others] : others };
  });
}

/** A comment's body: its text with each mention drawn as a pill by the chat parts renderer. */
function MentionBody({ message }: { message: MessageComposerMessage }) {
  return <ChatParts parts={[{ type: 'text', format: 'plain', ...message }]} />;
}

/**
 * A thread whose composer and editor are the rich composer: `@` picks a person as a pill, the
 * emoji button inserts at the caret, and the mentions stay with the comment through sending and
 * editing. The thread passes plain text to `onEdit`; the host keeps the edited message's mentions
 * beside it.
 */
export function MentionThread() {
  const [comments, setComments] = useState(opening);
  const edited = useRef<MessageComposerMessage | null>(null);
  const update = (id: number, change: (comment: MentionComment) => MentionComment) =>
    setComments((list) => list.map((comment) => (comment.id === id ? change(comment) : comment)));
  return (
    <CommentThread
      data-lab-thread="mentions"
      composer={
        <RichMessageComposer
          aria-label="Reply"
          placeholder="Reply, @ to mention"
          mentions={mentionable}
          minRows={1}
          startControls={<MessageComposerEmojiButton />}
          onSubmit={(message) =>
            setComments((list) => [
              ...list,
              {
                id: list.length + 1,
                author: maria,
                time: new Date().toISOString(),
                message,
                reactions: [],
              },
            ])
          }
        />
      }
    >
      {comments.map((comment) => (
        <CommentThreadReply
          key={comment.id}
          author={comment.author}
          time={comment.time}
          text={comment.message.text}
          isEdited={comment.isEdited}
          onEdit={
            comment.author === maria
              ? (text) =>
                  update(comment.id, (current) => ({
                    ...current,
                    message: edited.current ?? { text, tokens: [] },
                    isEdited: true,
                  }))
              : undefined
          }
          renderEditor={(options) => (
            <RichMessageComposer
              aria-label="Edit comment"
              mentions={mentionable}
              minRows={1}
              defaultValue={comment.message}
              startControls={<MessageComposerEmojiButton />}
              onCancel={options.onCancel}
              onSubmit={(message) => {
                edited.current = message;
                return options.onSubmit(message.text);
              }}
            />
          )}
          reactions={
            <ReactionBar
              reactions={comment.reactions}
              onToggle={(emoji, isReacted) =>
                update(comment.id, (current) => ({
                  ...current,
                  reactions: toggleReaction(current.reactions, emoji, isReacted),
                }))
              }
            />
          }
        >
          <MentionBody message={comment.message} />
        </CommentThreadReply>
      ))}
    </CommentThread>
  );
}

interface StoredComment {
  id: number;
  author: typeof maria | typeof jon;
  text: string;
  isEdited?: boolean;
}

/**
 * A thread with built-in mentions: the default composer and editor take `@`, the comments keep
 * their mentions as tokens in their text, and each chip opens the person's card.
 */
export function BuiltInMentionThread() {
  const [comments, setComments] = useState<StoredComment[]>([
    { id: 1, author: jon, text: '@[Lena Ortiz](lena) can you taste the pear sauce before Friday?' },
  ]);
  return (
    <CommentThread
      data-lab-thread="built-in-mentions"
      mentions={sampleMentions}
      onReply={(text) =>
        setComments((list) => [...list, { id: list.length + 1, author: maria, text }])
      }
    >
      {comments.map((comment) => (
        <CommentThreadReply
          key={comment.id}
          author={comment.author}
          time="2026-04-20T09:40:00"
          text={comment.text}
          isEdited={comment.isEdited}
          onEdit={
            comment.author === maria
              ? (text) =>
                  setComments((list) =>
                    list.map((entry) =>
                      entry.id === comment.id ? { ...entry, text, isEdited: true } : entry,
                    ),
                  )
              : undefined
          }
        >
          <CommentText text={comment.text} renderCard={renderSampleCard} />
        </CommentThreadReply>
      ))}
    </CommentThread>
  );
}
