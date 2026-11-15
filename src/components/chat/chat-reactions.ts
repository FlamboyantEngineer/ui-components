// The reactions on a chat's messages: who reacted, by participant, and a participant reacting.

import type { ReactionEntry } from '../reaction-bar/reaction-bar.js';
import type { ChatMessageData } from './chat-conversation.js';
import type { ChatParticipantIndex } from './chat-model.js';

/** A reaction on a message: an emoji and who reacted, as participants (such as an assistant) or names. */
export interface ChatReaction extends ReactionEntry {
  /**
   * The participants who reacted, in order. The chip names them before `people` and counts them
   * when `count` is missing; the reader is one of them when their id is here.
   */
  participantIds?: readonly string[] | undefined;
}

/** A participant reacting to a message with an emoji, or taking the reaction back. */
export interface ChatReactionChange {
  messageId: string;
  emoji: string;
  participantId: string;
  /** Whether the participant now reacts with the emoji. Defaults to true. */
  isReacted?: boolean | undefined;
}

/** Whether a reaction still counts someone, so it keeps its chip. */
function hasReactors(reaction: ChatReaction): boolean {
  if (reaction.count !== undefined) return reaction.count > 0;
  return (reaction.participantIds?.length ?? 0) + (reaction.people?.length ?? 0) > 0;
}

/** The reactions with the participant's reaction added or taken back; the same array when unchanged. */
function toChangedReactions(
  reactions: readonly ChatReaction[],
  change: ChatReactionChange,
): readonly ChatReaction[] {
  const { emoji, participantId, isReacted = true } = change;
  const found = reactions.find((reaction) => reaction.emoji === emoji);
  const ids = found?.participantIds ?? [];
  if (ids.includes(participantId) === isReacted) return reactions;
  if (!found) return [...reactions, { emoji, participantIds: [participantId] }];
  const step = isReacted ? 1 : -1;
  const next: ChatReaction = {
    ...found,
    participantIds: isReacted ? [...ids, participantId] : ids.filter((id) => id !== participantId),
    ...(found.count === undefined ? {} : { count: found.count + step }),
  };
  return reactions
    .map((reaction) => (reaction === found ? next : reaction))
    .filter((reaction) => reaction !== next || hasReactors(next));
}

/**
 * The conversation with a participant's reaction to the message `messageId` added or taken back,
 * as an assistant or a person reacts; the same array when nothing changes. A reaction that no
 * longer counts anyone leaves the message.
 */
export function setChatReaction(
  messages: readonly ChatMessageData[],
  change: ChatReactionChange,
): readonly ChatMessageData[] {
  const index = messages.findIndex((message) => message.id === change.messageId);
  const message = messages[index];
  if (!message) return messages;
  const before = message.reactions ?? [];
  const reactions = toChangedReactions(before, change);
  if (reactions === before) return messages;
  return messages.with(index, { ...message, reactions });
}

/** Whether the reader reacts with the reaction: by its `isReacted`, or as one of its participants. */
export function isReaderReaction(reaction: ChatReaction, currentUserId: string): boolean {
  return Boolean(reaction.isReacted) || Boolean(reaction.participantIds?.includes(currentUserId));
}

/** The reactions as a reaction bar draws them: participants named and counted, the reader's pressed. */
export function toReactionEntries(
  reactions: readonly ChatReaction[],
  context: { participants: ChatParticipantIndex; currentUserId: string },
): ReactionEntry[] {
  return reactions.map(({ participantIds = [], ...reaction }) => {
    const names = participantIds.flatMap((id) => context.participants.get(id)?.name ?? []);
    const people = [...names, ...(reaction.people ?? [])];
    return {
      ...reaction,
      count: reaction.count ?? participantIds.length + (reaction.people?.length ?? 0),
      isReacted: isReaderReaction({ ...reaction, participantIds }, context.currentUserId),
      people,
    };
  });
}
