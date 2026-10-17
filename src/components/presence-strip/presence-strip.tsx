import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys, type KeyedValue } from '../../utils/stable-keys.js';
import {
  getDisplayName,
  resolveAvatarColor,
  splitAvatarIdentity,
  type AvatarIdentity,
  type AvatarProps,
} from '../avatar/avatar.js';
import {
  PresenceAvatar,
  type PresenceAvatarProps,
  type PresenceAvatarSize,
} from '../presence-avatar/presence-avatar.js';

/** One person in a presence strip. */
export interface PresencePerson
  extends AvatarIdentity, Pick<PresenceAvatarProps, 'status' | 'statusLabel'> {
  /** Stable id, passed to `onAction` and used to keep each person's element across renders. */
  id: string;
}

/** `avatars` draws named avatars; `dots` draws decorative colour dots for use inside another control. */
export type PresenceStripVariant = 'avatars' | 'dots';

export interface PresenceStripProps extends Pick<AvatarProps, 'colorCount'>, BaseProps {
  /** The people present, in the order to show them. */
  people: readonly PresencePerson[];
  /** Show at most this many people; the rest join the overflow count. Defaults to all of them. */
  maxVisible?: number | undefined;
  /** People the caller already left out of `people`, added to the overflow count. */
  overflowCount?: number | undefined;
  /** Names of the people counted by `overflowCount`, announced with the overflow count. */
  hiddenNames?: readonly string[] | undefined;
  /** Defaults to `avatars`. */
  variant?: PresenceStripVariant | undefined;
  /** Avatar size. Defaults to `md`. */
  size?: PresenceAvatarSize | undefined;
  /** Makes each avatar a button that reports the person's id. */
  onAction?: ((id: string) => void) | undefined;
  /** A card about a visible person, usually a `UserCard`, that pressing their avatar opens. */
  renderCard?: ((person: PresencePerson) => ReactNode) | undefined;
  /** Names the group. Defaults to the names of everyone present. */
  'aria-label'?: string | undefined;
}

/** The people a strip shows and how many more it counts. */
interface PresenceWindow {
  visible: Array<KeyedValue<PresencePerson>>;
  hidden: readonly PresencePerson[];
  overflow: number;
}

type PresenceWindowOptions = Pick<PresenceStripProps, 'people' | 'maxVisible' | 'overflowCount'>;

interface PresenceLabelOptions
  extends Pick<PresenceStripProps, 'people' | 'hiddenNames'>, Omit<PresenceWindow, 'visible'> {
  ariaLabel: string | undefined;
}

interface PresenceStripPersonProps extends Pick<
  PresenceStripProps,
  'size' | 'colorCount' | 'onAction' | 'renderCard'
> {
  person: PresencePerson;
}

interface PresenceStripOverflowProps {
  count: number;
  /** Names the count as an image; without one the count is plain text. */
  label?: string | undefined;
}

const hooks = createHooks('presence-strip', ['person', 'dot', 'overflow']);

function wholeCount(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function windowPeople({
  people,
  maxVisible,
  overflowCount,
}: PresenceWindowOptions): PresenceWindow {
  const limit =
    maxVisible === undefined || !Number.isFinite(maxVisible)
      ? people.length
      : wholeCount(maxVisible);
  const hidden = people.slice(limit);
  return {
    visible: assignOccurrenceKeys(people.slice(0, limit), (person) => person.id),
    hidden,
    overflow: hidden.length + wholeCount(overflowCount),
  };
}

/** The group's name and the overflow's name, with blank names read as the `unnamed` string. */
function usePresenceLabels({
  people,
  hiddenNames = [],
  ariaLabel,
  hidden,
  overflow,
}: PresenceLabelOptions) {
  const strings = useUiStrings();
  const displayName = (person: PresencePerson) => getDisplayName(person.name, strings.unnamed);
  const extraNames = hiddenNames.map((name) => name.trim()).filter(Boolean);
  const allNames = [...people.map(displayName), ...extraNames];
  return {
    group: ariaLabel?.trim() || allNames.join(', ') || strings.morePeople(overflow, []),
    overflow: strings.morePeople(overflow, [...hidden.map(displayName), ...extraNames]),
  };
}

function PresenceStripPerson({
  person,
  size,
  colorCount,
  onAction,
  renderCard,
}: PresenceStripPersonProps) {
  const [identity] = splitAvatarIdentity(person);
  return (
    <PresenceAvatar
      {...identity}
      status={person.status}
      statusLabel={person.statusLabel}
      size={size}
      colorCount={colorCount}
      className={hooks.slotClass('person')}
      onPress={onAction ? () => onAction(person.id) : undefined}
      card={renderCard?.(person)}
    />
  );
}

function PresenceStripOverflow({ count, label }: PresenceStripOverflowProps) {
  if (count === 0) return null;
  return (
    <span {...hooks.slot('overflow')} {...(label ? { role: 'img', 'aria-label': label } : {})}>
      {`+${count}`}
    </span>
  );
}

/** The people present, with an overflow count past `maxVisible`. Renders nothing when nobody is present. */
export function PresenceStrip({
  people,
  maxVisible,
  overflowCount,
  hiddenNames,
  variant = 'avatars',
  size = 'md',
  colorCount,
  onAction,
  renderCard,
  'aria-label': ariaLabel,
  className,
  ...rest
}: PresenceStripProps) {
  const { visible, hidden, overflow } = windowPeople({ people, maxVisible, overflowCount });
  const labels = usePresenceLabels({ people, hiddenNames, ariaLabel, hidden, overflow });
  if (visible.length === 0 && overflow === 0) return null;
  const isDots = variant === 'dots';
  return (
    <span
      {...rest}
      {...hooks.root({ className, data: { variant, size } })}
      {...(isDots ? { 'aria-hidden': true } : { role: 'group', 'aria-label': labels.group })}
    >
      {visible.map(({ key, value }) =>
        isDots ? (
          <span
            key={key}
            {...hooks.slot('dot', { color: resolveAvatarColor(value, colorCount) })}
          />
        ) : (
          <PresenceStripPerson
            key={key}
            person={value}
            size={size}
            colorCount={colorCount}
            onAction={onAction}
            renderCard={renderCard}
          />
        ),
      )}
      <PresenceStripOverflow count={overflow} label={isDots ? undefined : labels.overflow} />
    </span>
  );
}
