import type { ReactNode } from 'react';
import { Button as AriaButton, type PressEvent } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  Avatar,
  getDisplayName,
  splitAvatarIdentity,
  type AvatarIdentity,
  type AvatarProps,
} from '../avatar/avatar.js';
import { UserCardTrigger, type UserCardProps } from '../user-card/user-card.js';

export type PresenceAvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

export interface PresenceAvatarProps
  extends
    AvatarIdentity,
    Pick<AvatarProps, 'colorCount'>,
    Pick<UserCardProps, 'status'>,
    BaseProps {
  /** Human-readable status, added to the accessible name (`Maria Santos, Away`). */
  statusLabel?: string | undefined;
  /** Avatar size. Defaults to `md`. */
  size?: PresenceAvatarSize | undefined;
  /** Makes the avatar a button that runs this on click, Enter or Space. */
  onPress?: ((event: PressEvent) => void) | undefined;
  /** A card about the person, usually a `UserCard`, that pressing the avatar opens in a popover. */
  card?: ReactNode;
}

type PresenceAvatarRootProps = Pick<PresenceAvatarProps, 'onPress' | 'card'> &
  BaseProps & { children: ReactNode };

const hooks = createHooks('presence-avatar', ['avatar', 'indicator']);

/** The element around the avatar: a card trigger with `card`, a button with `onPress`, else a span. */
function PresenceAvatarRoot({ onPress, card, children, ...rest }: PresenceAvatarRootProps) {
  if (card) {
    return (
      <UserCardTrigger {...rest} card={card} onPress={onPress}>
        {children}
      </UserCardTrigger>
    );
  }
  if (onPress) {
    return (
      <AriaButton {...rest} onPress={onPress}>
        {children}
      </AriaButton>
    );
  }
  return <span {...rest}>{children}</span>;
}

/**
 * One person's avatar marked with what they are doing, optionally pressable. The avatar carries the
 * accessible name, so a pressable one is named by its content rather than by a label that hides the
 * visible initials.
 */
export function PresenceAvatar(props: PresenceAvatarProps) {
  const [identity, { status, statusLabel, size = 'md', colorCount, className, ...rest }] =
    splitAvatarIdentity(props);
  const strings = useUiStrings();
  const statusValue = status?.trim() || undefined;
  const statusText = statusLabel?.trim();
  const displayName = getDisplayName(identity.name, strings.unnamed);
  return (
    <PresenceAvatarRoot
      {...rest}
      {...hooks.root({ className, data: { size, status: statusValue } })}
    >
      <Avatar
        {...identity}
        colorCount={colorCount}
        size={size}
        label={statusText ? strings.nameWithStatus(displayName, statusText) : undefined}
        className={hooks.slotClass('avatar')}
      />
      {statusValue ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
    </PresenceAvatarRoot>
  );
}
