'use client';

import type { ReactNode } from 'react';
import type { BaseProps, Size } from '../../core/props.js';
import { assignOccurrenceKeys } from '../../utils/stable-keys.js';
import type { AvatarIdentity, AvatarProps } from '../avatar/avatar.js';
import { AvatarGroupPeople } from './avatar-group-people.js';
import { AvatarGroupListTrigger } from './avatar-group-list.js';
import { usePresenceLabels, windowPeople } from './avatar-group-window.js';
import { avatarGroupHooks as hooks } from './avatar-group-hooks.js';

export interface AvatarGroupPerson
  extends AvatarIdentity, Pick<AvatarProps, 'status' | 'statusLabel'> {
  /** Stable identity, retained across reordering and passed to person actions. */
  id: string;
  /** Secondary text in the full list, such as a role. */
  description?: string | undefined;
}
export type AvatarGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type AvatarGroupLayout = 'stack' | 'strip' | 'dots';
export type AvatarGroupAction = 'none' | 'list';
export type AvatarGroupOverflow = 'count' | 'menu';

export interface AvatarGroupProps
  extends BaseProps, Pick<AvatarProps, 'colorCount' | 'variant' | 'nameTooltip' | 'cardTrigger'> {
  /** The people in display order, including optional presence status. */
  people: readonly AvatarGroupPerson[];
  /** Maximum visible people; the rest join the overflow count. Defaults to all. */
  maxVisible?: number | undefined;
  /** Additional people already omitted from the supplied list. */
  overflowCount?: number | undefined;
  /** Names announced for the additional overflow count. */
  hiddenNames?: readonly string[] | undefined;
  /** Overlapping avatars, a spaced presence strip, or decorative dots. Defaults to stack. */
  layout?: AvatarGroupLayout | undefined;
  /** Avatar size. Defaults to md. */
  size?: AvatarGroupSize | undefined;
  /** Lists everyone from the whole group. Person actions apply with none, the default. */
  action?: AvatarGroupAction | undefined;
  /** Makes each avatar pressable and reports the selected person. */
  onAction?: ((id: string) => void) | undefined;
  /** A person card opened from a visible avatar. */
  renderCard?: ((person: AvatarGroupPerson) => ReactNode) | undefined;
  /** Lists the hidden people from the overflow count. Defaults to count. */
  overflow?: AvatarGroupOverflow | undefined;
  /** Names the group; defaults to the people it contains. */
  'aria-label'?: string | undefined;
}

/** One group of identities, including optional presence, cards, commands and overflow. */
export function AvatarGroup({
  people,
  maxVisible,
  overflowCount,
  hiddenNames,
  layout = 'stack',
  size = 'md',
  variant,
  colorCount,
  onAction,
  renderCard,
  overflow = 'count',
  nameTooltip,
  cardTrigger,
  action = 'none',
  'aria-label': ariaLabel,
  className,
  ...rest
}: AvatarGroupProps) {
  const presence = windowPeople({ people, maxVisible, overflowCount });
  const labels = usePresenceLabels({
    people,
    hiddenNames,
    ariaLabel,
    hidden: presence.hidden,
    overflow: presence.overflow,
  });
  if (presence.visible.length === 0 && presence.overflow === 0) return null;
  const content = (
    <AvatarGroupPeople
      presence={presence}
      labels={labels}
      layout={layout}
      size={size}
      variant={variant}
      colorCount={colorCount}
      onAction={onAction}
      renderCard={renderCard}
      overflow={overflow}
      nameTooltip={nameTooltip}
      cardTrigger={cardTrigger}
      isList={action === 'list'}
    />
  );
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { layout, size, overflow, action } })}
      {...(layout === 'dots'
        ? { 'aria-hidden': true }
        : { role: 'group', 'aria-label': labels.group })}
    >
      {action === 'list' && layout !== 'dots' ? (
        <AvatarGroupListTrigger
          people={assignOccurrenceKeys(people, (person) => person.id)}
          colorCount={colorCount}
        >
          {content}
        </AvatarGroupListTrigger>
      ) : (
        content
      )}
    </span>
  );
}
