import type { ReactNode } from 'react';
import { GridListItem, Text, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { capitalizeText, describeRelativeTime } from '../../utils/relative-time.js';
import { Avatar, type AvatarIdentity } from '../avatar/avatar.js';
import { AvatarGroup } from '../avatar-group/avatar-group.js';
import { Badge } from '../badge/badge.js';
import { Icon } from '../icon/icon.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { TextMatch } from '../text-match/text-match.js';

/** One person in a conversation. */
export interface ChatListParticipant extends AvatarIdentity {
  /** Stable id, used to keep each person's avatar across renders. */
  id: string;
  /** A presence word the stylesheet draws on the avatar, such as `online` or `away`. */
  presence?: string | undefined;
  /** The presence in words, read after the person's name, such as "Online". */
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
  /** The reader turned the conversation's notifications off. */
  isMuted?: boolean | undefined;
}

interface ChatListRowProps {
  conversation: ChatConversation;
  renderActions: ((conversation: ChatConversation) => ReactNode) | undefined;
  getNow: () => Date;
}

export const listHooks = createHooks('chat-list', [
  'header',
  'search',
  'new',
  'list',
  'conversation',
  'avatar',
  'title',
  'time',
  'preview',
  'muted',
  'unread',
  'actions',
  'empty',
  'skeleton',
]);

/** The time as the row shows it, for the row's name. */
function useTimeText(value: string | undefined, getNow: () => Date): string | undefined {
  const { locale } = useLocale();
  const text = value
    ? describeRelativeTime(value, { now: getNow(), locale, fallbackAfterDays: 7 })
    : null;
  if (!text) return undefined;
  return text.isRelative ? capitalizeText(text.relative, locale) : text.relative;
}

/** The conversation's own avatar, its one participant with presence, or its participants' stack. */
function ConversationAvatar({ conversation }: { conversation: ChatConversation }) {
  const { avatar, participants = [] } = conversation;
  const [first] = participants;
  if (avatar) return <Avatar {...avatar} size="md" decorative />;
  if (participants.length > 1)
    return <AvatarGroup people={participants} size="sm" maxVisible={2} />;
  if (!first) return <Avatar name={conversation.title} size="md" decorative />;
  const { id: _id, presence, presenceLabel, ...identity } = first;
  return <Avatar {...identity} status={presence} statusLabel={presenceLabel} size="md" />;
}

/**
 * One conversation: its avatar, title, relative time, last message, muted mark, unread count and
 * the host's actions. The row is named by its title, presence, unread count, muted state and time,
 * then the last message.
 */
export function ChatListRow({ conversation, renderActions, getNow }: ChatListRowProps) {
  const strings = useUiStrings();
  const { title, lastMessage, time, isMuted = false, participants = [] } = conversation;
  const unread = normalizeCount(conversation.unreadCount) ?? 0;
  const timeText = useTimeText(time, getNow);
  const presence = conversation.avatar ? undefined : participants[0]?.presenceLabel?.trim();
  const actions = renderActions?.(conversation);
  const label = strings.conversationLabel({
    title,
    presence: participants.length === 1 ? presence || undefined : undefined,
    unreadCount: unread,
    isMuted,
    time: timeText,
  });
  return (
    <GridListItem
      id={conversation.id}
      textValue={title}
      aria-label={label}
      {...listHooks.slot('conversation', { unread: unread > 0, muted: isMuted })}
    >
      <span {...listHooks.slot('avatar')} aria-hidden="true">
        <ConversationAvatar conversation={conversation} />
      </span>
      <span {...listHooks.slot('title')}>
        <TextMatch>{title}</TextMatch>
      </span>
      {time ? (
        <RelativeTime
          value={time}
          getNow={getNow}
          showTooltip={false}
          className={listHooks.slotClass('time')}
        />
      ) : null}
      {lastMessage ? (
        <Text slot="description" className={listHooks.slotClass('preview')}>
          <TextMatch>{lastMessage}</TextMatch>
        </Text>
      ) : null}
      {isMuted ? (
        <Icon
          glyph="bell-slash"
          label={strings.conversationMuted}
          className={listHooks.slotClass('muted')}
        />
      ) : null}
      {unread > 0 ? (
        <Badge
          count={unread}
          max={99}
          size="sm"
          aria-label={strings.unreadMessages(unread)}
          className={listHooks.slotClass('unread')}
        />
      ) : null}
      {actions ? <div {...listHooks.slot('actions')}>{actions}</div> : null}
    </GridListItem>
  );
}
