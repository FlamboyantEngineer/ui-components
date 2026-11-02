'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, PresenceStatus, Size, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toImageProps } from '../icon/icon.js';
import {
  Avatar,
  getDisplayName,
  splitAvatarIdentity,
  type AvatarBadgeProps,
  type AvatarIdentity,
  type AvatarProps,
  resolveBadgePlacement,
  resolveStatusLabel,
} from '../avatar/avatar.js';

export type UserIdentitySize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

export interface UserIdentityProps
  extends
    AvatarIdentity,
    AvatarBadgeProps,
    Pick<AvatarProps, 'colorCount'>,
    BaseProps,
    RefProps<HTMLSpanElement> {
  /** A secondary line under the name: an email, a role, a timestamp. Blank values draw no line. */
  description?: ReactNode;
  /** Content after the name on the same line, such as a badge. */
  nameSuffix?: ReactNode;
  /** Selects the avatar size. Defaults to `md`. */
  size?: UserIdentitySize | undefined;
  /** The person's presence, published as `data-status` and drawn as a status badge. */
  status?: PresenceStatus | undefined;
  /** The status in words, which names the badge. Defaults to the provider's `presenceStatus`. */
  statusLabel?: string | undefined;
}

const hooks = createHooks('user-identity', [
  'avatar',
  'content',
  'title',
  'name',
  'description',
  'indicator',
  'badge-label',
]);

/**
 * A decorative avatar, a display name, an optional secondary line and an optional status badge, for
 * rows that name a person.
 */
export function UserIdentity(props: UserIdentityProps) {
  const [
    identity,
    { description, nameSuffix, size = 'md', colorCount, status, statusLabel, className, ...others },
  ] = splitAvatarIdentity(props);
  const { badge, badgeLabel, badgePlacement, ...rest } = others;
  const strings = useUiStrings();
  return (
    <span {...rest} {...hooks.root({ className, data: { size, status } })}>
      <Avatar
        {...identity}
        colorCount={colorCount}
        size={size}
        badge={badge}
        // The identity draws its own status indicator, on the corner the avatar keeps for it.
        badgePlacement={resolveBadgePlacement(badgePlacement, Boolean(status))}
        decorative
        className={hooks.slotClass('avatar')}
      />
      <span {...hooks.slot('content')}>
        <span {...hooks.slot('title')}>
          <span {...hooks.slot('name')}>{getDisplayName(identity.name, strings.unnamed)}</span>
          {nameSuffix}
        </span>
        {/* A space keeps the two lines apart in a name computed from content, even unstyled. */}
        {isEmptyNode(description, { isBlankEmpty: true }) ? null : (
          <>
            {' '}
            <span {...hooks.slot('description')}>{description}</span>
          </>
        )}
      </span>
      {/* After the text and a space, so the status is read after the name; the stylesheet places it
      on the avatar. */}
      {status ? (
        <>
          {' '}
          <span
            {...hooks.slot('indicator')}
            {...toImageProps(resolveStatusLabel({ status, statusLabel }, strings))}
          />
        </>
      ) : null}
      {/* The decorative avatar draws the badge; its words follow the name and the status. */}
      {badgeLabel?.trim() && !isEmptyNode(badge) ? (
        <>
          {' '}
          <span {...hooks.slot('badge-label')} {...toImageProps(badgeLabel.trim())} />
        </>
      ) : null}
    </span>
  );
}
