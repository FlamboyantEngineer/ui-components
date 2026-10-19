import { Fragment } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys, type KeyedValue } from '../../utils/stable-keys.js';
import {
  Avatar,
  getDisplayName,
  splitAvatarIdentity,
  type AvatarIdentity,
  type AvatarProps,
} from '../avatar/avatar.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** One person in an avatar group. */
export interface AvatarGroupPerson extends AvatarIdentity {
  /** Stable id, used to keep each person's element across renders. */
  id: string;
  /** A secondary line in the list of everyone, such as a role. */
  description?: string | undefined;
}

export type AvatarGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

/** `none` draws the stack only; `list` makes it a button that lists everyone in a popover. */
export type AvatarGroupAction = 'none' | 'list';

export interface AvatarGroupProps extends Pick<AvatarProps, 'colorCount' | 'variant'>, BaseProps {
  /** The people, in the order to stack them. */
  people: readonly AvatarGroupPerson[];
  /** Show at most this many avatars; the rest join the `+N` count. Defaults to all of them. */
  maxVisible?: number | undefined;
  /** Avatar size. Defaults to `md`. */
  size?: AvatarGroupSize | undefined;
  /** What pressing the group does. Defaults to `none`. */
  action?: AvatarGroupAction | undefined;
  /** Names the group. Defaults to the names of everyone in it. */
  'aria-label'?: string | undefined;
}

interface AvatarStackProps extends Pick<AvatarGroupProps, 'colorCount' | 'variant' | 'size'> {
  visible: Array<KeyedValue<AvatarGroupPerson>>;
  hidden: Array<KeyedValue<AvatarGroupPerson>>;
  /** Puts hidden commas between the names, for a button named by its content. */
  isSeparated: boolean;
}

const hooks = createHooks('avatar-group', [
  'avatar',
  'overflow',
  'trigger',
  'popover',
  'list',
  'item',
]);

function visibleCount(maxVisible: number | undefined, total: number): number {
  return maxVisible === undefined || !Number.isFinite(maxVisible)
    ? total
    : Math.max(0, Math.trunc(maxVisible));
}

/** A comma only assistive technology hears, so names read as a list inside a button's name. */
function Separator() {
  return (
    <>
      <VisuallyHidden elementType="span">,</VisuallyHidden>{' '}
    </>
  );
}

function AvatarStack({ visible, hidden, size, isSeparated, ...avatar }: AvatarStackProps) {
  const strings = useUiStrings();
  const hiddenNames = hidden.map(({ value }) => getDisplayName(value.name, strings.unnamed));
  return (
    <>
      {visible.map(({ key, value }, position) => {
        const [identity] = splitAvatarIdentity(value);
        return (
          <Fragment key={key}>
            {isSeparated && position > 0 ? <Separator /> : null}
            <Avatar {...identity} {...avatar} size={size} className={hooks.slotClass('avatar')} />
          </Fragment>
        );
      })}
      {hidden.length > 0 ? (
        <>
          {isSeparated && visible.length > 0 ? <Separator /> : null}
          <span
            {...hooks.slot('overflow')}
            role="img"
            aria-label={strings.morePeople(hidden.length, hiddenNames)}
          >
            {`+${hidden.length}`}
          </span>
        </>
      ) : null}
    </>
  );
}

function AvatarGroupList({
  people,
  colorCount,
}: Pick<AvatarGroupProps, 'colorCount'> & { people: Array<KeyedValue<AvatarGroupPerson>> }) {
  return (
    <ul {...hooks.slot('list')}>
      {people.map(({ key, value }) => {
        const [identity, { description }] = splitAvatarIdentity(value);
        return (
          <li key={key} {...hooks.slot('item')}>
            <UserIdentity
              {...identity}
              colorCount={colorCount}
              size="sm"
              description={description}
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * An overlapping stack of avatars with a `+N` count past `maxVisible`, named by everyone's names.
 * With `action="list"` the stack is a button that opens a popover listing everyone.
 */
export function AvatarGroup({
  people,
  maxVisible,
  size = 'md',
  variant,
  colorCount,
  action = 'none',
  'aria-label': ariaLabel,
  className,
  ...rest
}: AvatarGroupProps) {
  const strings = useUiStrings();
  const keyed = assignOccurrenceKeys(people, (person) => person.id);
  const limit = visibleCount(maxVisible, keyed.length);
  const label =
    ariaLabel?.trim() ||
    people.map((person) => getDisplayName(person.name, strings.unnamed)).join(', ');
  if (keyed.length === 0) return null;
  const stack = {
    visible: keyed.slice(0, limit),
    hidden: keyed.slice(limit),
    size,
    variant,
    colorCount,
  };

  return (
    <span
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, action } })}
      role="group"
      aria-label={label}
    >
      {action === 'none' ? (
        <AvatarStack {...stack} isSeparated={false} />
      ) : (
        <PopoverTrigger>
          {/* Named by its content, the avatars' and the count's names, so its label holds the visible text. */}
          <AriaButton {...hooks.slot('trigger')}>
            <AvatarStack {...stack} isSeparated />
          </AriaButton>
          <Popover
            title={strings.peopleCount(people.length)}
            placement="bottom start"
            className={hooks.slotClass('popover')}
          >
            <AvatarGroupList people={keyed} colorCount={colorCount} />
          </Popover>
        </PopoverTrigger>
      )}
    </span>
  );
}
