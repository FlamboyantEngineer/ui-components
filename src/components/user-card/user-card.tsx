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
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { DescriptionList, DescriptionRow } from '../description-list/description-list.js';
import type { IconSource } from '../icon/icon.js';
import { UserIdentity } from '../user-identity/user-identity.js';

/** One labelled fact about the person, such as a team or a local time. */
export interface UserCardDetail {
  label: ReactNode;
  value: ReactNode;
}

/** A command the card offers, such as sending a message or opening a profile. */
export interface UserCardAction {
  /** Reported to `onAction`. */
  id: string;
  label: string;
  icon?: IconSource | undefined;
}

export interface UserCardProps
  extends
    Omit<DialogProps, 'className' | 'style' | 'children' | 'render'>,
    AvatarIdentity,
    BaseProps {
  /** A secondary line under the name: an email, a role. */
  description?: ReactNode;
  /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, …). */
  status?: string | undefined;
  /** Human-readable status, shown in the status row. */
  statusLabel?: string | undefined;
  details?: readonly UserCardDetail[] | undefined;
  actions?: readonly UserCardAction[] | undefined;
  /** Called with an action's `id` when it is pressed. Inside a card trigger, the card closes first. */
  onAction?: ((id: string) => void) | undefined;
  /** How many colour slots the host stylesheet defines, passed to the avatar. */
  colorCount?: number | undefined;
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
export function UserCard({
  name,
  src,
  initials,
  colorKey,
  colorIndex,
  kind,
  colorCount,
  description,
  status,
  statusLabel,
  details = [],
  actions,
  onAction,
  className,
  ...rest
}: UserCardProps) {
  const strings = useUiStrings();
  const statusText = statusLabel?.trim();
  return (
    <Dialog
      {...rest}
      {...hooks.root({ className, props: rest, data: { status: status?.trim() || undefined } })}
      aria-label={rest['aria-label'] ?? (name.trim() || strings.unnamed)}
    >
      <UserIdentity
        {...{ name, src, initials, colorKey, colorIndex, kind, colorCount, description }}
        className={hooks.slotClass('identity')}
      />
      {statusText ? (
        <div {...hooks.slot('status')}>
          <span {...hooks.slot('indicator')} aria-hidden="true" />
          <span {...hooks.slot('status-label')}>{statusText}</span>
        </div>
      ) : null}
      {details.length > 0 ? (
        <DescriptionList className={hooks.slotClass('details')}>
          {details.map((detail, index) => (
            <DescriptionRow key={index} label={detail.label}>
              {detail.value}
            </DescriptionRow>
          ))}
        </DescriptionList>
      ) : null}
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
      <AriaButton {...rest} className={mergeClassNames(hooks.slotClass('trigger'), className)}>
        {children}
      </AriaButton>
      <Popover className={hooks.slotClass('popover')}>{card}</Popover>
    </DialogTrigger>
  );
}
