'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, PresenceStatus, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Dialog } from '../../primitives/index.js';
import {
  type AvatarBadgeProps,
  type AvatarIdentity,
  getDisplayName,
  resolveStatusLabel,
  splitAvatarIdentity,
} from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import type { IconSource } from '../icon/icon.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { useUserCardOwner } from '../user-card-trigger/user-card-trigger.js';
import { UserIdentity, type UserIdentityProps } from '../user-identity/user-identity.js';

/** One labelled fact about the person, such as a team or a local time. */
export interface UserCardDetail {
  /**
   * Identifies the row across updates, so a value keeps its state and focus when details are
   * added, removed or reordered. Unique among the card's details.
   */
  id: string;
  /** What the fact is, such as `Team`. */
  label: ReactNode;
  /** The fact itself. */
  value: ReactNode;
}

/** A command the card offers, such as sending a message or opening a profile. */
export interface UserCardAction {
  /** Reported to `onAction`. */
  id: string;
  /** The button's text. */
  label: string;
  /** A icon component or rendered element drawn before the label. */
  icon?: IconSource | undefined;
}

export interface UserCardProps
  extends
    RefProps<HTMLElement>,
    AvatarIdentity,
    AvatarBadgeProps,
    Pick<UserIdentityProps, 'description' | 'colorCount'>,
    BaseProps {
  /** Names the card instead of the display name. */
  'aria-label'?: string | undefined;
  /** The person's presence, published as `data-status`. */
  status?: PresenceStatus | undefined;
  /** The status in words, shown in the status row. Defaults to the provider's `presenceStatus`. */
  statusLabel?: string | undefined;
  /** Labelled facts about the person, shown as description rows. */
  details?: readonly UserCardDetail[] | undefined;
  /** Commands the card offers, shown as buttons. */
  actions?: readonly UserCardAction[] | undefined;
  /** Called with an action's `id` when it is pressed. Inside a card trigger, the card closes first. */
  onAction?: ((id: string) => void) | undefined;
  /** The profile is loading: the status, details and actions give way to a decorative skeleton. */
  isLoading?: boolean | undefined;
}

const hooks = createHooks('user-card', [
  'identity',
  'status',
  'indicator',
  'status-label',
  'details',
  'actions',
  'action',
  'skeleton',
]);

function CardStatus(props: Pick<UserCardProps, 'status' | 'statusLabel'>) {
  const text = resolveStatusLabel(props, useUiStrings());
  if (!text) return null;
  return (
    <div {...hooks.slot('status')}>
      <span {...hooks.slot('indicator')} aria-hidden="true" />
      <span {...hooks.slot('status-label')}>{text}</span>
    </div>
  );
}

function CardDetails({ details }: Pick<UserCardProps, 'details'>) {
  if (!details?.length) return null;
  return (
    <DescriptionList className={hooks.slotClass('details')}>
      {details.map((detail) => (
        <DescriptionRow key={detail.id} label={detail.label}>
          {detail.value}
        </DescriptionRow>
      ))}
    </DescriptionList>
  );
}

function CardActions({ actions, onAction }: Pick<UserCardProps, 'actions' | 'onAction'>) {
  const owner = useUserCardOwner();
  if (!actions?.length) return null;
  return (
    <div {...hooks.slot('actions')}>
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          startIcon={action.icon}
          className={hooks.slotClass('action')}
          onPress={(event) => {
            owner?.dismiss(event.target);
            onAction?.(action.id);
          }}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * The card's dialog. React Aria's Dialog takes focus when it mounts, which suits a card that its
 * trigger opens on press; a card shown on hover or in place must not move focus, so there it is a
 * plain dialog element.
 */
function UserCardRoot({
  isLoading,
  children,
  ...props
}: BaseProps & { 'aria-label': string; isLoading: boolean; children: ReactNode }) {
  const owner = useUserCardOwner();
  if (!owner || owner.isPreview) {
    return (
      <section {...props} role="dialog" aria-busy={isLoading || undefined}>
        {children}
      </section>
    );
  }
  return (
    // React Aria's Dialog forwards no `aria-busy`.
    <Dialog
      {...props}
      render={isLoading ? (dialog) => <section {...dialog} aria-busy="true" /> : undefined}
    >
      {children}
    </Dialog>
  );
}

/**
 * The identity card of a person or group: avatar, name, a secondary line, an optional status row,
 * detail rows and actions. A dialog named by the person, usually opened by a `UserCardTrigger`.
 */
export function UserCard(props: UserCardProps) {
  const [identity, cardProps] = splitAvatarIdentity(props);
  const {
    colorCount,
    description,
    status,
    statusLabel,
    badge,
    badgeLabel,
    badgePlacement,
    details,
    actions,
    onAction,
    isLoading = false,
    className,
    'aria-label': ariaLabel,
    ...rest
  } = cardProps;
  const strings = useUiStrings();
  return (
    <UserCardRoot
      {...rest}
      {...hooks.root({
        className,
        data: { status, loading: isLoading },
      })}
      aria-label={ariaLabel ?? getDisplayName(identity.name, strings.unnamed)}
      isLoading={isLoading}
    >
      <UserIdentity
        {...identity}
        colorCount={colorCount}
        description={description}
        {...{ badge, badgeLabel, badgePlacement }}
        className={hooks.slotClass('identity')}
      />
      {isLoading ? (
        <Skeleton className={hooks.slotClass('skeleton')} />
      ) : (
        <>
          <CardStatus status={status} statusLabel={statusLabel} />
          <CardDetails details={details} />
          <CardActions actions={actions} onAction={onAction} />
        </>
      )}
    </UserCardRoot>
  );
}
