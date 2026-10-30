'use client';

import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import type {
  ChatMessageOrigin,
  ChatMessageTimePlacement,
  ChatMessageVariant,
} from '../chat-transcript/chat-transcript.js';

/** How a chat draws its messages: with or without avatars, author names, times and backgrounds. */
export interface ChatMessageDisplayOptions {
  /** Shows each author's avatar at the start of their messages. Defaults to `true`. */
  showAvatars?: boolean | undefined;
  /** Shows each author's name at the start of their messages. Defaults to `true`. */
  showAuthorNames?: boolean | undefined;
  /**
   * Where each message shows its time: in the `header` (the default), in the `footer` under the
   * message, which the reference stylesheet shows with the actions on hover and focus, in a
   * `tooltip` while the message is hovered or holds focus, or `none`.
   */
  timePlacement?: ChatMessageTimePlacement | undefined;
  /**
   * Where a message without written text shows its time, with the same choices: tool calls,
   * reasoning, plans, sources, files, custom parts or a reply that has written nothing yet.
   * Defaults to `timePlacement`.
   */
  activityTimePlacement?: ChatMessageTimePlacement | undefined;
  /**
   * Gives a time in the footer, alone there, no room until the message is hovered or holds focus.
   * Defaults to `false`, the time's line always kept.
   */
  collapseFooterTime?: boolean | undefined;
  /** Draws the reader's own messages in a `bubble` (the default) or `plain`. */
  sentVariant?: ChatMessageVariant | undefined;
  /** Draws everyone else's messages, an assistant's too, in a `bubble` (the default) or `plain`. */
  receivedVariant?: ChatMessageVariant | undefined;
}

/** The display options, kept while they stay the same, so unchanged messages do not render again. */
export function useMessageDisplay({
  showAvatars,
  showAuthorNames,
  timePlacement,
  activityTimePlacement,
  collapseFooterTime,
  sentVariant,
  receivedVariant,
}: ChatMessageDisplayOptions): ChatMessageDisplayOptions {
  return useShallowStable({
    ...{ showAvatars, showAuthorNames, timePlacement, activityTimePlacement },
    ...{ collapseFooterTime, sentVariant, receivedVariant },
  });
}

/** Whether `message` shows written text: a text part with words, or the deleted marker. */
function isWritten(message: ChatMessageData): boolean {
  return (
    Boolean(message.isDeleted) ||
    message.parts.some((part) => part.type === 'text' && part.text.trim() !== '')
  );
}

/** Where `message` shows its time: a message without written text follows its own setting. */
export function toTimePlacement(
  message: ChatMessageData,
  display: ChatMessageDisplayOptions,
): ChatMessageTimePlacement | undefined {
  return isWritten(message)
    ? display.timePlacement
    : (display.activityTimePlacement ?? display.timePlacement);
}

/** The variant of a message from `origin`; a notice keeps the default. */
export function toMessageVariant(
  origin: ChatMessageOrigin,
  display: ChatMessageDisplayOptions,
): ChatMessageVariant | undefined {
  if (origin === 'sent') return display.sentVariant;
  return origin === 'received' ? display.receivedVariant : undefined;
}
