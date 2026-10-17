import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { withStableOccurrenceKeys } from '../../utils/stable-keys.js';
import { resolveAvatarColor, type AvatarIdentity } from '../avatar/avatar.js';
import { PresenceAvatar, type PresenceAvatarSize } from '../presence-avatar/presence-avatar.js';

/** One person in a presence strip. */
export interface PresencePerson extends AvatarIdentity {
  /** Stable id, passed to `onAction` and used to keep each person's element across renders. */
  id: string;
  /** What the person is doing, published on their avatar as `data-status`. */
  status?: string | undefined;
  /** Human-readable status, added to the person's accessible name. */
  statusLabel?: string | undefined;
}

/** `avatars` draws named avatars; `dots` draws decorative colour dots for use inside another control. */
export type PresenceStripVariant = 'avatars' | 'dots';

export interface PresenceStripProps {
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
  /** How many colour slots the host stylesheet defines. */
  colorCount?: number | undefined;
  /** Makes each avatar a button that reports the person's id. */
  onAction?: ((id: string) => void) | undefined;
  /** Names the group. Defaults to the names of everyone present. */
  'aria-label'?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('presence-strip', ['person', 'dot', 'overflow']);

function wholeCount(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

/** The people present, with an overflow count past `maxVisible`. Renders nothing when nobody is present. */
export function PresenceStrip({
  people,
  maxVisible,
  overflowCount,
  hiddenNames = [],
  variant = 'avatars',
  size = 'md',
  colorCount,
  onAction,
  'aria-label': ariaLabel,
  className,
  id,
  ...rest
}: PresenceStripProps) {
  const strings = useUiStrings();
  const limit =
    maxVisible === undefined || !Number.isFinite(maxVisible)
      ? people.length
      : wholeCount(maxVisible);
  const keyed = withStableOccurrenceKeys(people, (person) => person.id);
  const visible = keyed.slice(0, limit);
  const hidden = keyed.slice(limit);
  const overflow = hidden.length + wholeCount(overflowCount);
  if (visible.length === 0 && overflow === 0) return null;

  const rootProps = hooks.root({ className, props: rest, data: { variant, size } });
  const overflowText = `+${overflow}`;

  if (variant === 'dots') {
    return (
      <span {...rootProps} id={id} aria-hidden="true">
        {visible.map(({ key, value }) => (
          <span
            key={key}
            {...hooks.slot('dot', { color: resolveAvatarColor(value, colorCount) })}
          />
        ))}
        {overflow > 0 ? <span {...hooks.slot('overflow')}>{overflowText}</span> : null}
      </span>
    );
  }

  const displayName = (name: string) => name.trim() || strings.unnamed;
  const extraNames = hiddenNames.map((name) => name.trim()).filter(Boolean);
  const overflowNames = [...hidden.map(({ value }) => displayName(value.name)), ...extraNames];
  const groupLabel =
    ariaLabel?.trim() ||
    [...people.map((person) => displayName(person.name)), ...extraNames].join(', ') ||
    strings.morePeople(overflow, []);

  return (
    <span {...rootProps} id={id} role="group" aria-label={groupLabel}>
      {visible.map(({ key, value: person }) => (
        <PresenceAvatar
          key={key}
          className={hooks.slotClass('person')}
          name={person.name}
          src={person.src}
          initials={person.initials}
          colorKey={person.colorKey}
          colorIndex={person.colorIndex}
          kind={person.kind}
          status={person.status}
          statusLabel={person.statusLabel}
          size={size}
          colorCount={colorCount}
          onPress={onAction ? () => onAction(person.id) : undefined}
        />
      ))}
      {overflow > 0 ? (
        <span
          {...hooks.slot('overflow')}
          role="img"
          aria-label={strings.morePeople(overflow, overflowNames)}
        >
          {overflowText}
        </span>
      ) : null}
    </span>
  );
}
