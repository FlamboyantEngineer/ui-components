import { getLocalTimeZone, parseIsoDateTime, toCalendarDate } from '../../primitives/index.js';
import type { ChatMessageDelivery, ChatMessageGroupPosition } from './chat-message.js';

/** The fields of a message that decide where it groups. */
export interface ChatGroupableMessage {
  id: string;
  /** Who wrote it; a message without an author never groups. */
  authorId?: string | undefined;
  /** When it was written: an ISO 8601 date and time, with an offset or read as local time. */
  createdAt: string;
  /** A system notice, which never groups. */
  isSystem?: boolean | undefined;
  /** A failed send never groups. */
  delivery?: ChatMessageDelivery | undefined;
}

export interface GroupChatMessagesOptions {
  /** The first message the reader has not seen; the unread divider goes before it. */
  firstUnreadId?: string | undefined;
  /** The longest pause between two messages of one group, in milliseconds. Defaults to 5 minutes. */
  maxGap?: number | undefined;
  /** The IANA time zone whose days the date separators follow. Defaults to the reader's. */
  timeZone?: string | undefined;
}

/**
 * One entry of a conversation to render, in order: a date separator for a day (`YYYY-MM-DD`), the
 * unread divider, or a message with its group position. `key` is stable across renders.
 */
export type ChatSequenceItem<M extends ChatGroupableMessage> =
  | { kind: 'date'; key: string; date: string }
  | { kind: 'unread'; key: string }
  | { kind: 'message'; key: string; message: M; groupPosition: ChatMessageGroupPosition };

interface Moment {
  instant: number;
  day: string;
}

interface Placed<M extends ChatGroupableMessage> {
  message: M;
  moment: Moment | null;
  /** Whether it continues the group of the message just before it. */
  joins: boolean;
}

const defaultMaxGap = 5 * 60 * 1000;

/** The instant of a date and time and its calendar day in `timeZone`; `null` when unreadable. */
function readMoment(text: string, timeZone: string): Moment | null {
  const dateTime = parseIsoDateTime(text, timeZone);
  if (!dateTime || !('timeZone' in dateTime)) return null;
  return { instant: dateTime.toDate().getTime(), day: toCalendarDate(dateTime).toString() };
}

function isGroupable(message: ChatGroupableMessage): boolean {
  return Boolean(message.authorId) && !message.isSystem && message.delivery !== 'failed';
}

/** Whether `current` continues the group of `previous`, with nothing between them. */
function canJoin<M extends ChatGroupableMessage>(
  previous: Placed<M> | null,
  current: Omit<Placed<M>, 'joins'>,
  maxGap: number,
): boolean {
  if (!previous?.moment || !current.moment) return false;
  if (!isGroupable(previous.message) || !isGroupable(current.message)) return false;
  if (previous.message.authorId !== current.message.authorId) return false;
  return Math.abs(current.moment.instant - previous.moment.instant) <= maxGap;
}

function positionOf(joinsPrevious: boolean, joinsNext: boolean): ChatMessageGroupPosition {
  if (joinsPrevious) return joinsNext ? 'middle' : 'last';
  return joinsNext ? 'first' : 'single';
}

/** Lays out the messages with date separators and the unread divider, each one breaking groups. */
function placeMessages<M extends ChatGroupableMessage>(
  messages: readonly M[],
  options: GroupChatMessagesOptions,
): Array<Placed<M> | { kind: 'date'; date: string } | { kind: 'unread' }> {
  const timeZone = options.timeZone ?? getLocalTimeZone();
  const maxGap = options.maxGap ?? defaultMaxGap;
  const entries: Array<Placed<M> | { kind: 'date'; date: string } | { kind: 'unread' }> = [];
  let previous: Placed<M> | null = null;
  let day: string | null = null;
  for (const message of messages) {
    const moment = readMoment(message.createdAt, timeZone);
    if (moment && moment.day !== day) {
      entries.push({ kind: 'date', date: moment.day });
      day = moment.day;
      previous = null;
    }
    if (message.id === options.firstUnreadId) {
      entries.push({ kind: 'unread' });
      previous = null;
    }
    const placed: Placed<M> = {
      message,
      moment,
      joins: canJoin(previous, { message, moment }, maxGap),
    };
    entries.push(placed);
    previous = placed;
  }
  return entries;
}

/**
 * Turns messages, oldest first, into the sequence to render: a date separator before the first
 * message of each day (in `timeZone`, the reader's by default), the unread divider before
 * `firstUnreadId`, and each message with its group position. Consecutive messages by one author
 * group while each follows the last within `maxGap`; a date change, the unread divider, a system
 * notice, a message without an author and a failed send break groups.
 */
export function groupChatMessages<M extends ChatGroupableMessage>(
  messages: readonly M[],
  options: GroupChatMessagesOptions = {},
): Array<ChatSequenceItem<M>> {
  const entries = placeMessages(messages, options);
  return entries.map((entry, index): ChatSequenceItem<M> => {
    if (!('message' in entry)) {
      return entry.kind === 'date'
        ? { kind: 'date', key: `date-${entry.date}`, date: entry.date }
        : { kind: 'unread', key: 'unread' };
    }
    const next = entries[index + 1];
    const joinsNext = next !== undefined && 'message' in next && next.joins;
    return {
      kind: 'message',
      key: entry.message.id,
      message: entry.message,
      groupPosition: positionOf(entry.joins, joinsNext),
    };
  });
}
