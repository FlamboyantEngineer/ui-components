'use client';

import { Fragment } from 'react';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { resolveAvatarColor } from '../avatar/avatar.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { AvatarGroupProps, AvatarGroupPerson } from './avatar-group.js';
import type { AvatarGroupWindow } from './avatar-group-window.js';
import { AvatarGroupOverflowMenu } from './avatar-group-overflow-menu.js';
import { avatarGroupHooks as hooks } from './avatar-group-hooks.js';

function AvatarGroupPersonView({
  person,
  onAction,
  renderCard,
  ...avatar
}: Pick<
  AvatarGroupProps,
  'size' | 'variant' | 'colorCount' | 'onAction' | 'renderCard' | 'nameTooltip' | 'cardTrigger'
> & { person: AvatarGroupPerson }) {
  const [identity] = splitAvatarIdentity(person);
  return (
    <Avatar
      {...identity}
      {...avatar}
      status={person.status}
      statusLabel={person.statusLabel}
      className={hooks.slotClass('avatar')}
      onPress={onAction ? () => onAction(person.id) : undefined}
      card={renderCard?.(person)}
    />
  );
}

function AvatarGroupOverflow({
  presence: { overflow: count, hidden },
  label,
  overflow,
  colorCount,
  onAction,
}: Pick<AvatarGroupProps, 'overflow' | 'colorCount' | 'onAction'> & {
  presence: AvatarGroupWindow;
  label?: string | undefined;
}) {
  if (count === 0) return null;
  if (label && overflow === 'menu' && hidden.length > 0) {
    return (
      <AvatarGroupOverflowMenu
        count={count}
        label={label}
        hidden={hidden}
        colorCount={colorCount}
        onAction={onAction}
      />
    );
  }
  return (
    <span {...hooks.slot('overflow')} {...(label ? { role: 'img', 'aria-label': label } : {})}>
      {`+${count}`}
    </span>
  );
}

/** The same people and overflow in stacked, spaced or decorative-dot layouts. */
export function AvatarGroupPeople({
  presence,
  labels,
  layout,
  isList,
  overflow,
  ...avatar
}: Pick<
  AvatarGroupProps,
  | 'layout'
  | 'size'
  | 'variant'
  | 'colorCount'
  | 'onAction'
  | 'renderCard'
  | 'nameTooltip'
  | 'cardTrigger'
  | 'overflow'
> & { presence: AvatarGroupWindow; labels: { overflow: string }; isList: boolean }) {
  const isDots = layout === 'dots';
  return (
    <>
      {presence.visible.map(({ key, value }, index) => (
        <Fragment key={key}>
          {isList && index > 0 ? (
            <>
              <VisuallyHidden elementType="span">,</VisuallyHidden>{' '}
            </>
          ) : null}
          {isDots ? (
            <span {...hooks.slot('dot', { color: resolveAvatarColor(value, avatar.colorCount) })} />
          ) : (
            <AvatarGroupPersonView
              {...avatar}
              person={value}
              onAction={isList ? undefined : avatar.onAction}
              renderCard={isList ? undefined : avatar.renderCard}
              nameTooltip={isList ? false : avatar.nameTooltip}
            />
          )}
        </Fragment>
      ))}
      {isList && presence.visible.length > 0 && presence.overflow > 0 ? (
        <>
          <VisuallyHidden elementType="span">,</VisuallyHidden>{' '}
        </>
      ) : null}
      <AvatarGroupOverflow
        {...avatar}
        presence={presence}
        label={isDots ? undefined : labels.overflow}
        overflow={isList ? 'count' : overflow}
      />
    </>
  );
}
