'use client';

import { createContext, useContext, useId, useRef, type ReactNode } from 'react';
import { Button as AriaButton, Dialog, Provider } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps, PressEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, PresenceStatus } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  getDisplayName,
  resolveStatusLabel,
  splitAvatarIdentity,
  type AvatarIdentity,
} from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import { HoverCard, type HoverCardTriggerProps } from '../hover-card/hover-card.js';
import type { IconSource } from '../icon/icon.js';
import { PopoverPanel } from '../popover/popover.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { UserIdentity, type UserIdentityProps } from '../user-identity/user-identity.js';
import { restoreFocus, useCardOpening, type UserCardTriggerType } from './user-card-opening.js';

export type { UserCardTriggerType } from './user-card-opening.js';

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
  extends AvatarIdentity, Pick<UserIdentityProps, 'description' | 'colorCount'>, BaseProps {
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

export interface UserCardTriggerProps
  extends
    OpenStateProps,
    Pick<HoverCardTriggerProps, 'delay' | 'closeDelay'>,
    PressEventProps,
    BaseProps {
  /** Opens nothing and refuses presses. */
  isDisabled?: boolean | undefined;
  /**
   * The card to open, usually a `UserCard`. Without one the trigger is a plain button; a card that
   * arrives or leaves later keeps the same button, and its focus.
   */
  card?: ReactNode;
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

/** The `UserCardTrigger` that opened a card, which its actions dismiss. */
interface UserCardOwner {
  /** The card opened on hover, where it must not take focus as a dialog would. */
  isPreview: boolean;
  /** Closes the card from the pressed action, returning focus to the trigger if the action held it. */
  dismiss: (action: Element) => void;
}

/**
 * Set by a `UserCardTrigger` around its own card only; a card rendered anywhere else, an ancestor's
 * overlay included, has no owner to close.
 */
const UserCardOwnerContext = createContext<UserCardOwner | null>(null);

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
  const owner = useContext(UserCardOwnerContext);
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
  const owner = useContext(UserCardOwnerContext);
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

/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover on the `dropdown` layer, on press or, with `trigger="hover"`, in a `HoverCard` on hover and
 * keyboard focus. Escape and the card's actions close it, returning focus to the trigger. The button
 * stays the same element while `card` comes and goes.
 */
export function UserCardTrigger({
  card,
  children,
  trigger = 'press',
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  delay,
  closeDelay,
  className,
  onPress,
  isDisabled,
  ...rest
}: UserCardTriggerProps) {
  const [isOpen, setOpen] = useControllableState(isOpenProp, defaultOpen, onOpenChange);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasCard = card !== undefined && card !== null && card !== false;
  const isPreview = trigger === 'hover';
  const fallbackId = useId();
  const triggerId = rest.id ?? fallbackId;
  const opening = useCardOpening({
    mode: hasCard ? trigger : undefined,
    isOpen,
    setOpen,
    buttonRef,
    triggerId,
    delay,
    closeDelay,
    isDisabled,
  });
  const owner: UserCardOwner = {
    isPreview,
    dismiss: (action) => {
      const hadFocus = action.contains(action.ownerDocument.activeElement);
      setOpen(false);
      // A press card's dialog returns focus as it closes; a hover card only returns it to where it
      // was when the card opened, which after a hover is the page.
      if (isPreview && hadFocus && buttonRef.current) restoreFocus(buttonRef.current);
    },
  };
  const popover = hasCard ? (
    <UserCardOwnerContext value={owner}>{card}</UserCardOwnerContext>
  ) : null;
  return (
    // The same providers and button render with or without a card, so the button keeps its focus.
    <Provider values={opening.contexts as never}>
      <AriaButton
        {...rest}
        {...opening.triggerProps}
        id={triggerId}
        ref={buttonRef}
        isDisabled={isDisabled}
        onPress={(event) => {
          onPress?.(event);
          opening.onPress?.();
        }}
        // The slot marks a button that opens a card.
        {...(hasCard ? hooks.slot('trigger', undefined, className) : { className })}
      >
        {children}
      </AriaButton>
      {popover && isPreview ? (
        <HoverCard className={hooks.slotClass('popover')}>{popover}</HoverCard>
      ) : null}
      {popover && !isPreview ? (
        <PopoverPanel className={hooks.slotClass('popover')}>{popover}</PopoverPanel>
      ) : null}
    </Provider>
  );
}
