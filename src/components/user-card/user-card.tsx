import { useContext, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  OverlayTriggerStateContext,
  Popover,
  type ButtonProps as AriaButtonProps,
  type DialogProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName, splitAvatarIdentity, type AvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import type { IconSource } from '../icon/icon.js';
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
  /** A glyph name or icon node drawn before the label. */
  icon?: IconSource | undefined;
}

export interface UserCardProps
  extends
    Omit<DialogProps, 'className' | 'style' | 'children' | 'render'>,
    AvatarIdentity,
    Pick<UserIdentityProps, 'description' | 'colorCount'>,
    BaseProps {
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
}

export interface UserCardTriggerProps
  extends Omit<AriaButtonProps, 'className' | 'style' | 'children' | 'render'>, BaseProps {
  /** The card to open, usually a `UserCard`. */
  card: ReactNode;
  /** What the trigger shows: an avatar, a name or a user identity row. */
  children: ReactNode;
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
]);

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
    className,
    'aria-label': ariaLabel,
    ...rest
  } = cardProps;
  const strings = useUiStrings();
  return (
    <Dialog
      {...rest}
      {...hooks.root({ className, data: { status: status?.trim() || undefined } })}
      aria-label={ariaLabel ?? getDisplayName(identity.name, strings.unnamed)}
    >
      <UserIdentity
        {...identity}
        colorCount={colorCount}
        description={description}
        className={hooks.slotClass('identity')}
      />
      <CardStatus statusLabel={statusLabel} />
      <CardDetails details={details} />
      <CardActions actions={actions} onAction={onAction} />
    </Dialog>
  );
}

/**
 * Makes its content (an avatar, a name, a user identity row) a button that opens `card` in a
 * popover. Escape, a press outside and the card's actions close it, returning focus to the trigger.
 */
export function UserCardTrigger({ card, children, className, ...rest }: UserCardTriggerProps) {
  return (
    <DialogTrigger>
      <AriaButton {...rest} {...hooks.slot('trigger', undefined, className)}>
        {children}
      </AriaButton>
      <Popover className={hooks.slotClass('popover')}>{card}</Popover>
    </DialogTrigger>
  );
}
