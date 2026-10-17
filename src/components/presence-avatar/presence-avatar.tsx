import type { ReactNode } from 'react';
import { Button as AriaButton, Focusable, type PressEvent } from 'react-aria-components';
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
import { Tooltip } from '../tooltip/tooltip.js';
import {
  UserCardTrigger,
  type UserCardProps,
  type UserCardTriggerType,
} from '../user-card/user-card.js';

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
  /** A card about the person, usually a `UserCard`, that the avatar opens in a popover. */
  card?: ReactNode;
  /** How `card` opens: on press (the default), or on hover and keyboard focus after a delay. */
  cardTrigger?: UserCardTriggerType | undefined;
  /**
   * Shows the accessible name in a tooltip on hover and keyboard focus. An avatar without `onPress`
   * or `card` then takes focus, so keyboard users can reach the tooltip too.
   */
  nameTooltip?: boolean | undefined;
}

type PresenceAvatarRootProps = Pick<PresenceAvatarProps, 'onPress' | 'card' | 'cardTrigger'> &
  BaseProps & {
    /** The name of an avatar that is its own focusable image, for its tooltip. */
    imageLabel: string | undefined;
    /** Empty while a tooltip repeats the name, so the name is not read again as a description. */
    'aria-describedby': string | undefined;
    children: ReactNode;
  };

const hooks = createHooks('presence-avatar', ['avatar', 'indicator']);

/**
 * The element around the avatar: a card trigger with `card`, a button with `onPress`, a focusable
 * image for a name tooltip, else a span.
 */
function PresenceAvatarRoot({
  onPress,
  card,
  cardTrigger,
  imageLabel,
  children,
  ...rest
}: PresenceAvatarRootProps) {
  if (card) {
    return (
      <UserCardTrigger {...rest} card={card} trigger={cardTrigger} onPress={onPress}>
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
  if (imageLabel) {
    return (
      <Focusable>
        <span {...rest} role="img" aria-label={imageLabel}>
          {children}
        </span>
      </Focusable>
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
  const [
    identity,
    { status, statusLabel, size = 'md', colorCount, nameTooltip, className, ...rest },
  ] = splitAvatarIdentity(props);
  const strings = useUiStrings();
  const statusValue = status?.trim() || undefined;
  const statusText = statusLabel?.trim();
  const displayName = getDisplayName(identity.name, strings.unnamed);
  const accessibleName = statusText ? strings.nameWithStatus(displayName, statusText) : displayName;
  // A card that opens on hover already shows the name.
  const hasTooltip = nameTooltip && !(rest.card && rest.cardTrigger === 'hover');
  const isImage = hasTooltip && !rest.card && !rest.onPress;
  const root = (
    <PresenceAvatarRoot
      {...rest}
      {...hooks.root({ className, data: { size, status: statusValue } })}
      imageLabel={isImage ? accessibleName : undefined}
      aria-describedby={hasTooltip ? '' : undefined}
    >
      <Avatar
        {...identity}
        colorCount={colorCount}
        size={size}
        label={statusText ? accessibleName : undefined}
        decorative={isImage}
        className={hooks.slotClass('avatar')}
      />
      {statusValue ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
    </PresenceAvatarRoot>
  );
  return hasTooltip ? <Tooltip content={accessibleName}>{root}</Tooltip> : root;
}
