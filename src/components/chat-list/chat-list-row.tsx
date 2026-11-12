'use client';

import { useNow, useTimeZone } from '../../core/clock.js';
import { useClockTick } from '../../core/clock-tick.js';
import { BellSlashGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { PresenceStatus } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { GridListItem, Text, useLocale } from '../../primitives/index.js';
import { normalizeCount } from '../../utils/count.js';
import {
  capitalizeText,
  describeRelativeTime,
  formatStableTime,
} from '../../utils/relative-time.js';
import { Attribution, type AttributionProps } from '../attribution/attribution.js';
import { Avatar, type AvatarIdentity, resolveStatusLabel } from '../avatar/avatar.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { Badge } from '../badge/badge.js';
import { hasIcon, Icon, type IconSource, toIconProps } from '../icon/icon.js';
import { TextMatch } from '../text-match/text-match.js';
import { type ChatListMenu, useConversationMenuTarget } from './chat-list-menu.js';

/** One person in a conversation. */
export interface ChatListParticipant extends AvatarIdentity {
  /** Stable id, used to keep each person's avatar across renders. */
  id: string;
  /** The person's presence, drawn on the avatar. */
  presence?: PresenceStatus | undefined;
  /** The presence in words, read after the person's name. Defaults to the provider's `presenceStatus`. */
  presenceLabel?: string | undefined;
}

/** One conversation in a `ChatList`. */
export interface ChatConversation {
  /** Stable id, reported on selection. */
  id: string;
  /** The conversation's name: the other person's, or the group's. */
  title: string;
  /** The last message, shown on one line. */
  lastMessage?: string | undefined;
  /** When the last message arrived: an ISO 8601 date and time, read relative to now. */
  time?: string | undefined;
  /** How many messages the reader has not read; a badge shows the count above zero. */
  unreadCount?: number | undefined;
  /** Who takes part: one shows their avatar and presence, several stack their avatars. */
  participants?: readonly ChatListParticipant[] | undefined;
  /** A picture or initials for the conversation itself, such as a named group's. Wins over the participants. */
  avatar?: AvatarIdentity | undefined;
  /** A glyph at the row's start, for a conversation without an avatar or participants. */
  icon?: IconSource | undefined;
  /** The reader turned the conversation's notifications off. */
  isMuted?: boolean | undefined;
  /** A mark the host gives the conversation, such as `HistoryGlyph`, drawn at the row's end and read in its name. */
  status?: ChatConversationStatus | undefined;
  /**
   * What a participant is doing right now, such as "Typing" or "Working": animated dots at the row's
   * end, read in the row's name.
   */
  activity?: string | undefined;
}

/** A host's mark on a conversation: its glyph and what it means in words. */
export interface ChatConversationStatus {
  /** The glyph drawn at the row's end. */
  icon: IconSource;
  /** What the mark means, read in the row's name. */
  label: string;
}

/** How a conversation's time reads, in its row and in the row's name. */
type ChatListTimeOptions = Pick<AttributionProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'>;

interface ChatListRowProps extends ChatListTimeOptions {
  conversation: ChatConversation;
  /** The list's context menu, given that the row's conversation has one. */
  menu: ChatListMenu | undefined;
  /** The list's context menu is open for this row. */
  isMenuOpen: boolean;
}

export const listHooks = createHooks('chat-list', [
  'header',
  'search',
  'new',
  'body',
  'heading',
  'list',
  'conversation',
  'avatar',
  'title',
  'status',
  'activity',
  'activity-dot',
  'time',
  'preview',
  'muted',
  'unread',
  'empty',
  'skeleton',
  'load-more',
]);

/** The keys of the activity indicator's three dots. */
const activityDots = ['first', 'second', 'third'];

/**
 * The time as the row shows it, for the row's name: the stable absolute text on the server and while
 * hydrating, as the row's time shows it, then the words against `getNow()` in the reader's zone,
 * renamed when they change.
 */
function useTimeText(
  value: string | undefined,
  { fallbackAfterDays = 7, getNow, timeZone }: ChatListTimeOptions,
): string | undefined {
  const { locale } = useLocale();
  const now = useNow(getNow);
  const zone = useTimeZone(timeZone);
  const text =
    value && now
      ? describeRelativeTime(value, { now, locale, fallbackAfterDays, timeZone: zone })
      : null;
  useClockTick(text?.nextChange ?? null, now?.getTime() ?? 0);
  if (!value) return undefined;
  if (!now) return formatStableTime(value, locale) ?? undefined;
  if (!text) return undefined;
  return text.isRelative ? capitalizeText(text.relative, locale) : text.relative;
}

/**
 * The row's start: the conversation's own avatar, its one participant with presence, its
 * participants' stack or its icon.
 */
function ConversationAvatar({ conversation }: { conversation: ChatConversation }) {
  const { avatar, participants = [], icon } = conversation;
  const [first] = participants;
  if (avatar) return <Avatar {...avatar} size="md" decorative />;
  if (participants.length > 1)
    return <AvatarGroup people={participants} size="sm" maxVisible={2} />;
  if (!first) return <Icon {...toIconProps(icon)} />;
  const { id: _id, presence, presenceLabel, ...identity } = first;
  return <Avatar {...identity} status={presence} statusLabel={presenceLabel} size="md" />;
}

/** The row's start, given the conversation has an avatar, participants or an icon. */
function RowStart({ conversation }: { conversation: ChatConversation }) {
  const { avatar, participants = [], icon } = conversation;
  if (!avatar && participants.length === 0 && !hasIcon(icon)) return null;
  return (
    <span {...listHooks.slot('avatar')} aria-hidden="true">
      <ConversationAvatar conversation={conversation} />
    </span>
  );
}

/** The marks after the title: muted, the host's status and the activity dots. */
function RowMarks({ conversation }: { conversation: ChatConversation }) {
  const strings = useUiStrings();
  const { isMuted, status, activity } = conversation;
  return (
    <>
      {isMuted ? (
        <Icon
          icon={BellSlashGlyph}
          label={strings.conversationMuted}
          className={listHooks.slotClass('muted')}
        />
      ) : null}
      {status ? (
        <Icon
          {...toIconProps(status.icon)}
          label={status.label}
          className={listHooks.slotClass('status')}
        />
      ) : null}
      {activity ? (
        <span {...listHooks.slot('activity')} aria-hidden="true">
          {activityDots.map((key) => (
            <span key={key} {...listHooks.slot('activity-dot')} />
          ))}
        </span>
      ) : null}
    </>
  );
}

/** The row's name, from what it shows. */
function useRowLabel(conversation: ChatConversation, timeOptions: ChatListTimeOptions) {
  const strings = useUiStrings();
  const { title, isMuted = false, participants = [], status, activity } = conversation;
  const timeText = useTimeText(conversation.time, timeOptions);
  const [only] = participants;
  const presence =
    conversation.avatar || !only || participants.length > 1
      ? undefined
      : resolveStatusLabel({ status: only.presence, statusLabel: only.presenceLabel }, strings);
  return strings.conversationLabel({
    title,
    presence,
    unreadCount: normalizeCount(conversation.unreadCount) ?? 0,
    isMuted,
    status: status?.label,
    activity,
    time: timeText,
  });
}

/**
 * One conversation: its icon or avatar, title, muted mark, status mark, activity, relative time,
 * last message and unread count. The row is named by its title, presence, unread count, muted
 * state, status, activity and time, then the last message.
 */
export function ChatListRow({ conversation, menu, isMenuOpen, ...timeOptions }: ChatListRowProps) {
  const strings = useUiStrings();
  const { title, lastMessage, time, isMuted = false } = conversation;
  const unread = normalizeCount(conversation.unreadCount) ?? 0;
  const menuTarget = useConversationMenuTarget({ menu, id: conversation.id });
  return (
    <GridListItem
      {...menuTarget}
      id={conversation.id}
      textValue={title}
      aria-label={useRowLabel(conversation, timeOptions)}
      {...listHooks.slot('conversation', {
        unread: unread > 0,
        muted: isMuted,
        menuOpen: isMenuOpen,
      })}
    >
      <RowStart conversation={conversation} />
      <span {...listHooks.slot('title')}>
        <TextMatch>{title}</TextMatch>
      </span>
      {time ? (
        <Attribution
          time={time}
          {...timeOptions}
          showTooltip={false}
          className={listHooks.slotClass('time')}
        />
      ) : null}
      {lastMessage ? (
        <Text slot="description" className={listHooks.slotClass('preview')}>
          <TextMatch>{lastMessage}</TextMatch>
        </Text>
      ) : null}
      <RowMarks conversation={conversation} />
      {unread > 0 ? (
        <Badge
          count={unread}
          max={99}
          size="sm"
          aria-label={strings.unreadMessages(unread)}
          className={listHooks.slotClass('unread')}
        />
      ) : null}
    </GridListItem>
  );
}
