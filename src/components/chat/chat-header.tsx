'use client';

import type { ReactNode } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { AvatarGroup, type AvatarGroupPerson } from '../avatar-group/avatar-group.js';
import type { ChatParticipant } from '../chat-parts/chat-parts.js';
import { useHeadingLevel } from '../section-header/section-header.js';
import { chatHeaderHooks as hooks } from './chat-hooks.js';
import { toMessageAuthor } from './chat-model.js';

export interface ChatHeaderProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The conversation's name, drawn as a heading. */
  title: string;
  /**
   * The other participants: one shows their avatar with their presence; several stack their
   * avatars, which list everyone with their presence when pressed.
   */
  participants?: readonly ChatParticipant[] | undefined;
  /** Shows the participants' decorative identity. Defaults to `true`. */
  showIdentity?: boolean | undefined;
  /**
   * A line under the title, such as who is typing or what the assistant is doing. It is shown, not
   * announced, since the conversation announces the same news where it happens.
   */
  status?: string | undefined;
  /** Controls at the end, such as the conversation's commands. */
  actions?: ReactNode;
}

/** A participant as a person of an avatar group, their presence in words as the second line. */
function toGroupPerson(participant: ChatParticipant): AvatarGroupPerson {
  const [identity, { statusLabel }] = splitAvatarIdentity(toMessageAuthor(participant));
  return { ...identity, id: participant.id, description: statusLabel };
}

/** The other participants' avatars: one with their presence, or a stack that lists everyone. */
function HeaderAvatar({ participants }: { participants: readonly ChatParticipant[] }) {
  const [only] = participants;
  const className = hooks.slotClass('avatar');
  if (!only) return null;
  if (participants.length > 1) {
    return (
      <AvatarGroup
        people={participants.map(toGroupPerson)}
        maxVisible={3}
        size="sm"
        action="list"
        className={className}
      />
    );
  }
  const [identity, { status, statusLabel }] = splitAvatarIdentity(toMessageAuthor(only));
  return (
    <Avatar
      {...identity}
      status={status}
      statusLabel={statusLabel}
      size="sm"
      decorative={!status?.trim()}
      className={className}
    />
  );
}

/**
 * The top of a conversation: the other participants' avatars with their presence, the title as a
 * heading at the level its section gives, a line saying who is typing or what the assistant is
 * doing, and the host's controls.
 */
export function ChatHeader({
  ref,
  title,
  participants = [],
  showIdentity = true,
  status,
  actions,
  className,
  id,
  ...rest
}: ChatHeaderProps) {
  const Heading = `h${useHeadingLevel(undefined)}` as const;
  return (
    <div ref={ref} id={id} {...hooks.root({ className, props: rest })}>
      {showIdentity ? <HeaderAvatar participants={participants} /> : null}
      <div {...hooks.slot('text')}>
        <Heading {...hooks.slot('title')}>{title}</Heading>
        {status ? (
          <div {...hooks.slot('status')} aria-hidden="true">
            {status}
          </div>
        ) : null}
      </div>
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </div>
  );
}
