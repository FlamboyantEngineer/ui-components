import type { ChatFeedbackRating } from '../chat-message-actions/chat-message-actions.js';
import type {
  ChatMessageAuthor,
  ChatMessageDelivery,
  ChatMessageStatus,
} from '../chat-transcript/chat-transcript.js';
import type { ReactionEntry } from '../reaction-bar/reaction-bar.js';
import type { ChatPart } from './chat-part.js';

/** A person, or an assistant answering for software. */
export type ChatParticipantKind = 'person' | 'assistant';

/**
 * Someone taking part in a conversation: their identity, kind and presence. The avatar's own
 * `kind` gives way to the participant's, since a participant is always one person or assistant.
 */
export interface ChatParticipant extends Omit<ChatMessageAuthor, 'kind'> {
  id: string;
  kind: ChatParticipantKind;
}

/** One message of a conversation, as plain data. */
export interface ChatMessageData {
  id: string;
  /** The participant who wrote it; none for a system notice. */
  authorId?: string | undefined;
  /** When it was written, as an ISO 8601 date and time. */
  createdAt: string;
  /** Its content, in the order it was written. */
  parts: readonly ChatPart[];
  /** Defaults to `complete`. */
  status?: ChatMessageStatus | undefined;
  /** Why the message or its reply failed. */
  error?: string | undefined;
  /** Where a message the reader sent has got to. */
  delivery?: ChatMessageDelivery | undefined;
  isEdited?: boolean | undefined;
  isDeleted?: boolean | undefined;
  /** The id of the message this one replies to. */
  replyTo?: string | undefined;
  reactions?: readonly ReactionEntry[] | undefined;
  /** The reader's rating of an assistant reply. */
  feedback?: ChatFeedbackRating | undefined;
  /** What the assistant is doing while the message streams, such as `Searching recipes…`. */
  statusText?: string | undefined;
}
