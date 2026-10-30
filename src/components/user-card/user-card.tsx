'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  OverlayTriggerStateContext,
} from '../../primitives/index.js';
import type { OpenStateProps, PressEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName, splitAvatarIdentity, type AvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import {
  HoverCard,
  HoverCardTrigger,
  type HoverCardTriggerProps,
} from '../hover-card/hover-card.js';
import type { IconSource } from '../icon/icon.js';
import { PopoverPanel } from '../popover/popover.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { UserIdentity, type UserIdentityProps } from '../user-identity/user-identity.js';

/** One labelled fact about the person, such as a team or a local time. */
export interface UserCardDetail {
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
  extends AvatarIdentity, Pick<UserIdentityProps, 'description' | 'colorCount'>, BaseProps {
  /** Names the card instead of the display name. */
  'aria-label'?: string | undefined;
  /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, …). */
  status?: string | undefined;
  /** Human-readable status, shown in the status row. */
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

/** `press` opens the card on a click, Enter or Space; `hover` on hover, keyboard focus or long press. */
export type UserCardTriggerType = 'press' | 'hover';

export interface UserCardTriggerProps
  extends
    OpenStateProps,
    Pick<HoverCardTriggerProps, 'delay' | 'closeDelay'>,
    PressEventProps,
    BaseProps {
  /** Opens nothing and refuses presses. */
  isDisabled?: boolean | undefined;
  /** The card to open, usually a `UserCard`. */
  card: ReactNode;
  /** What the trigger shows: an avatar, a name or a user identity row. */
  children: ReactNode;
  /**
   * `press` (the default) opens the card on a click, Enter or Space. `hover` opens it `delay`
   * milliseconds after hover or keyboard focus, or on a long press, without moving focus, and closes
   * it `closeDelay` milliseconds after the pointer and focus leave; pressing then runs `onPress` only.
   */
  trigger?: UserCardTriggerType | undefined;
}

const hooks = createHooks('user-card', [
  'identity',
  'status',
  'indicator',
  'status-label',
  'details',
  'actions',
  'action',
  'trigger',
  'popover',
  'skeleton',
]);

/** Set inside a hover card's popover, where the card must not take focus as a dialog would. */
const UserCardPreviewContext = createContext(false);

function CardStatus({ statusLabel }: Pick<UserCardProps, 'statusLabel'>) {
  const text = statusLabel?.trim();
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
      {details.map((detail, index) => (
        <DescriptionRow key={index} label={detail.label}>
          {detail.value}
        </DescriptionRow>
      ))}
    </DescriptionList>
  );
}

function CardActions({ actions, onAction }: Pick<UserCardProps, 'actions' | 'onAction'>) {
  const overlay = useContext(OverlayTriggerStateContext);
  if (!actions?.length) return null;
  return (
    <div {...hooks.slot('actions')}>
      {actions.map((action) => (
        <Button
          key={action.id}
          size="sm"
          startIcon={action.icon}
          className={hooks.slotClass('action')}
          onPress={() => {
            overlay?.close();
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
 * The card's dialog. React Aria's Dialog takes focus when it mounts, which suits a card that opens in
 * an overlay; a card shown on hover or in place must not move focus, so there it is a plain dialog
 * element.
 */
function UserCardRoot({
  isLoading,
  children,
  ...props
}: BaseProps & { 'aria-label': string; isLoading: boolean; children: ReactNode }) {
  const isPreview = useContext(UserCardPreviewContext);
  const overlay = useContext(OverlayTriggerStateContext);
  if (isPreview || !overlay) {
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
        data: { status: status?.trim() || undefined, loading: isLoading },
      })}
      aria-label={ariaLabel ?? getDisplayName(identity.name, strings.unnamed)}
      isLoading={isLoading}
    >
      <UserIdentity
        {...identity}
        colorCount={colorCount}
        description={description}
        className={hooks.slotClass('identity')}
      />
      {isLoading ? (
        <Skeleton className={hooks.slotClass('skeleton')} />
      ) : (
        <>
          <CardStatus statusLabel={statusLabel} />
          <CardDetails details={details} />
          <CardActions actions={actions} onAction={onAction} />
        </>
      )}
    </UserCardRoot>
  );
}

/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the card's actions close it, returning focus to the trigger.
 */
export function UserCardTrigger({
  card,
  children,
  trigger = 'press',
  isOpen,
  defaultOpen,
  onOpenChange,
  delay,
  closeDelay,
  className,
  ...rest
}: UserCardTriggerProps) {
  const openState = { isOpen, defaultOpen, onOpenChange };
  const button = (
    <AriaButton {...rest} {...hooks.slot('trigger', undefined, className)}>
      {children}
    </AriaButton>
  );
  if (trigger === 'hover') {
    return (
      <HoverCardTrigger
        {...openState}
        delay={delay}
        closeDelay={closeDelay}
        isDisabled={rest.isDisabled}
      >
        {button}
        <HoverCard className={hooks.slotClass('popover')}>
          <UserCardPreviewContext.Provider value>{card}</UserCardPreviewContext.Provider>
        </HoverCard>
      </HoverCardTrigger>
    );
  }
  return (
    <DialogTrigger {...openState}>
      {button}
      <PopoverPanel className={hooks.slotClass('popover')}>{card}</PopoverPanel>
    </DialogTrigger>
  );
}
