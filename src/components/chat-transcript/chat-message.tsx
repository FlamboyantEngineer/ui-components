'use client';

import { type ReactNode, type RefObject, useId, useRef, useState } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useFocusWithin, useHover } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { mergeProps } from '../../utils/merge-props.js';
import { TOOLTIP_DELAY } from '../../utils/overlay-defaults.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import { type AvatarIdentity, type AvatarProps, getDisplayName } from '../avatar/avatar.js';
import { RelativeTime, type RelativeTimeProps } from '../relative-time/relative-time.js';
import { AnchoredTooltip } from '../tooltip/tooltip.js';
import {
  ChatMessageAvatar,
  ChatMessageBody,
  ChatMessageDeleted,
  ChatMessageHeader,
  chatMessageHooks as hooks,
  useAbsoluteTime,
} from './chat-message-parts.js';
import type { ChatQuoteData } from './chat-quote.js';
import { useTranscriptMessage } from './transcript-context.js';

/** `sent` by the reader, `received` from someone else (a person or an assistant), or a `system` notice. */
export type ChatMessageOrigin = 'sent' | 'received' | 'system';

/** `complete`, still `streaming` in, failed with an `error`, or `cancelled` (stopped) by the reader. */
export type ChatMessageStatus = 'complete' | 'streaming' | 'error' | 'cancelled';

/** Where a message the reader sent has got to: on its way, sent, delivered, read, or failed. */
export type ChatMessageDelivery = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/** How a message's content is drawn: in a `bubble` with a background, or `plain` text on the page. */
export type ChatMessageVariant = 'bubble' | 'plain';

/**
 * Where a message shows its time: in the `header` beside the author's name, in the `footer` under
 * the content (which a stylesheet shows with the actions, on hover and focus), in a `tooltip` while
 * the message is hovered or holds focus, or `none`.
 */
export type ChatMessageTimePlacement = 'header' | 'footer' | 'tooltip' | 'none';

/** A message's place in a run of messages by one author: alone, or first, middle or last. */
export type ChatMessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

/** The person or assistant who wrote a message, with their presence when known. */
export interface ChatMessageAuthor
  extends AvatarIdentity, Pick<AvatarProps, 'status' | 'statusLabel'> {}

export interface ChatMessageProps
  extends RefProps<HTMLElement>, BaseProps, Pick<RelativeTimeProps, 'getNow'> {
  /** Who the message is from, relative to the reader. Defaults to `received`. */
  origin?: ChatMessageOrigin | undefined;
  /** The person or assistant who wrote it, drawn as an avatar (with their presence) and a name. */
  author?: ChatMessageAuthor | undefined;
  /** Shows the author's avatar at the start of a group. Defaults to `true`. */
  showAvatar?: boolean | undefined;
  /** Shows the author's name at the start of a group. Defaults to `true`; the message's name keeps it. */
  showAuthorName?: boolean | undefined;
  /** Where the time shows. Defaults to `header`; the message's name keeps it either way. */
  timePlacement?: ChatMessageTimePlacement | undefined;
  /**
   * Gives a footer that holds only the time no room until it shows: publishes
   * `data-collapse-footer-time`, which the reference stylesheet opens on hover and focus. Defaults to
   * `false`, the time's line always kept.
   */
  collapseFooterTime?: boolean | undefined;
  /**
   * Shows a caret after the content while a received message streams: publishes
   * `data-streaming-caret`, which the reference stylesheet draws as `▍`. Defaults to `false`; the
   * message stays busy either way. Turn it on only while text streams into the content.
   */
  streamingCaret?: boolean | undefined;
  /** Draws the content in a `bubble` (the default) or as `plain` text. */
  variant?: ChatMessageVariant | undefined;
  /** When it was written: an ISO 8601 date and time, read relative to now. */
  time?: string | undefined;
  /** Defaults to `complete`. A streaming message is busy until it completes. */
  status?: ChatMessageStatus | undefined;
  /** Its place in a run of messages by one author. Defaults to `single`. */
  groupPosition?: ChatMessageGroupPosition | undefined;
  /** Where a message the reader sent has got to. */
  delivery?: ChatMessageDelivery | undefined;
  /** Why the message or its reply failed: an alert, or announced by the transcript it is in. */
  error?: string | undefined;
  /** Retries a failed send or a failed reply; shows a Retry button with `error` or `failed`. */
  onRetry?: (() => void) | undefined;
  /** Marks the message as changed after it was sent. */
  isEdited?: boolean | undefined;
  /** Replaces the content, quote, reactions and actions with a deleted placeholder. */
  isDeleted?: boolean | undefined;
  /** The message this one replies to. */
  quote?: ChatQuoteData | undefined;
  /** Called with the quoted message's id when the reader presses the quote. */
  onQuotePress?: ((messageId: string) => void) | undefined;
  /** The reactions, usually a `ReactionBar`. */
  reactions?: ReactNode;
  /** Who has read up to this message, usually `ChatReadReceipts`. */
  readers?: ReactNode;
  /** Commands about the message, such as copy or retry. */
  actions?: ReactNode;
  /** The message's content, such as text or rendered markdown. */
  children?: ReactNode;
}

/** Splits the props the body under the header shows from the article's own props. */
function splitBodyProps({
  quote,
  onQuotePress,
  error,
  onRetry,
  isEdited,
  reactions,
  actions,
  children,
  streamingCaret: _streamingCaret,
  ...own
}: Omit<ChatMessageProps, 'className'>) {
  return [
    { quote, onQuotePress, error, onRetry, isEdited, reactions, actions, children },
    own,
  ] as const;
}

/**
 * What the message shows: the author's avatar and name lead a group, and the time in its place,
 * unless hidden.
 */
function resolveDisplay({
  author,
  groupPosition,
  showAvatar = true,
  showAuthorName = true,
  timePlacement = 'header',
  variant = 'bubble',
  time,
}: Pick<
  ChatMessageProps,
  'author' | 'showAvatar' | 'showAuthorName' | 'timePlacement' | 'variant' | 'time'
> & {
  groupPosition: ChatMessageGroupPosition;
}) {
  const startsGroup = groupPosition === 'single' || groupPosition === 'first';
  const timeIn = (placement: ChatMessageTimePlacement) =>
    timePlacement === placement ? time : undefined;
  return {
    avatar: startsGroup && showAvatar ? author : undefined,
    showsName: startsGroup && showAuthorName,
    headerTime: timeIn('header'),
    footerTime: timeIn('footer'),
    tooltipTime: timeIn('tooltip'),
    variant,
    avatarHidden: !showAvatar,
  };
}

/** Whether the caret shows: asked for, on a received message that streams and is not deleted. */
function showsCaret(
  message: Pick<ChatMessageProps, 'streamingCaret' | 'status' | 'origin' | 'isDeleted'>,
): boolean {
  const { streamingCaret = false, status, origin, isDeleted } = message;
  return streamingCaret && status === 'streaming' && origin === 'received' && !isDeleted;
}

/** Whether the pointer is over the message and whether focus is inside it, for its hooks. */
function useMessageInteraction() {
  const { hoverProps, isHovered } = useHover({});
  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocusWithin });
  return { isHovered, isFocusWithin, interactionProps: mergeProps(hoverProps, focusWithinProps) };
}

/** The message's hidden name: its author and absolute time. */
function MessageLabel({ id, label }: { id: string; label: string | undefined }) {
  return label ? (
    <span id={id} hidden>
      {label}
    </span>
  ) : null;
}

/** The tooltip that shows the time, with the positioning and listeners an open tooltip needs. */
function MessageTimePanel({
  time,
  getNow,
  isOpen,
  anchor,
}: Pick<ChatMessageProps, 'getNow'> & {
  time: string;
  isOpen: boolean;
  anchor: RefObject<HTMLDivElement | null>;
}) {
  const isShown = useActiveAfter(isOpen, TOOLTIP_DELAY);
  return (
    <AnchoredTooltip
      isOpen={isShown}
      anchor={anchor}
      // The message's name already holds the absolute time.
      relationship="none"
      placement="top"
      content={
        // The tooltip takes no focus, so the time opens no tooltip of its own.
        <RelativeTime
          value={time}
          getNow={getNow}
          showTooltip={false}
          className={hooks.slotClass('time')}
        />
      }
    />
  );
}

/**
 * The time in a tooltip over the message's body once it has been hovered or held focus for the
 * tooltip delay, so a pointer passing over the chat opens nothing. A message that was never hovered
 * or focused holds no tooltip at all, so a long conversation does not carry one per message.
 */
function MessageTimeTooltip({
  time,
  isOpen,
  ...panel
}: Pick<ChatMessageProps, 'time' | 'getNow'> & {
  isOpen: boolean;
  anchor: RefObject<HTMLDivElement | null>;
}) {
  const [isUsed, setUsed] = useState(false);
  if (isOpen && !isUsed) setUsed(true);
  return time && isUsed ? <MessageTimePanel {...panel} time={time} isOpen={isOpen} /> : null;
}

/**
 * One message in a conversation: an `<article>` named by its author and absolute time, with the
 * author's avatar and name at the start of a group and a relative time (each unless hidden), the content
 * in a bubble or plain, its quote, markers, delivery, error, reactions, readers and actions. A
 * streaming message is busy (`aria-busy`) so assistive technology reads it once it completes.
 */
export function ChatMessage({
  origin = 'received',
  author,
  showAvatar,
  showAuthorName,
  timePlacement,
  collapseFooterTime = false,
  variant,
  time,
  status = 'complete',
  groupPosition = 'single',
  delivery,
  isDeleted = false,
  readers,
  getNow,
  className,
  ...rest
}: ChatMessageProps) {
  const strings = useUiStrings();
  const { isHovered, isFocusWithin, interactionProps } = useMessageInteraction();
  const labelId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const authorName = author ? getDisplayName(author.name, strings.unnamed) : undefined;
  const error = isDeleted ? undefined : rest.error;
  const transcript = useTranscriptMessage({ id: rest.id, authorName, origin, status, error });
  const label = strings.chatMessageLabel(authorName, useAbsoluteTime(time));
  const display = resolveDisplay({
    ...{ author, groupPosition, variant, time },
    ...{ showAvatar, showAuthorName, timePlacement },
  });
  const [body, own] = splitBodyProps(rest);
  const data = {
    ...{ variant: display.variant, origin, status, groupPosition, delivery },
    ...{ deleted: isDeleted, hovered: isHovered, focusWithin: isFocusWithin },
    ...{ avatarHidden: display.avatarHidden, collapseFooterTime },
    streamingCaret: showsCaret({ streamingCaret: rest.streamingCaret, status, origin, isDeleted }),
  };
  return (
    <article
      {...mergeProps(own, interactionProps, transcript)}
      {...hooks.root({ className, data })}
      aria-busy={status === 'streaming' || undefined}
      aria-labelledby={label ? labelId : undefined}
    >
      <MessageLabel id={labelId} label={label} />
      {display.avatar ? <ChatMessageAvatar author={display.avatar} /> : null}
      <div ref={bodyRef} {...hooks.slot('body')}>
        <ChatMessageHeader
          authorName={display.showsName ? authorName : undefined}
          time={display.headerTime}
          getNow={getNow}
        />
        {isDeleted ? (
          <ChatMessageDeleted time={display.footerTime} getNow={getNow} />
        ) : (
          <ChatMessageBody
            {...body}
            isCancelled={status === 'cancelled'}
            delivery={delivery}
            time={display.footerTime}
            getNow={getNow}
          />
        )}
        {isEmptyNode(readers) ? null : <div {...hooks.slot('readers')}>{readers}</div>}
      </div>
      <MessageTimeTooltip
        time={display.tooltipTime}
        getNow={getNow}
        isOpen={isHovered || isFocusWithin}
        anchor={bodyRef}
      />
    </article>
  );
}
