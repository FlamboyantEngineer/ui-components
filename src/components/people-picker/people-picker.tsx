import { useCallback, useId, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ControlSize, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, splitAvatarIdentity, type AvatarIdentity } from '../avatar/avatar.js';
import {
  Combobox,
  type ComboboxItem,
  type ComboboxLoader,
  type ComboboxOption,
  type ComboboxProps,
  type ComboboxSelectionMode,
} from '../combobox/combobox.js';
import { UserIdentity, type UserIdentitySize } from '../user-identity/user-identity.js';

/** A person or a group the picker lists. */
export interface PeoplePickerPerson extends AvatarIdentity {
  id: Key;
  /** A secondary line: an email, a role, a group's member count. */
  description?: string | undefined;
  /** The person cannot be picked, for example an inactive account. */
  isDisabled?: boolean | undefined;
  /** Why a disabled person cannot be picked, shown in place of the description. */
  disabledReason?: string | undefined;
}

/** One page of a search's people; a `cursor` means another page follows. */
export interface PeoplePickerPage {
  items: readonly PeoplePickerPerson[];
  /** Passed back to the loader to fetch the next page; absent on the last page. */
  cursor?: string | undefined;
}

/**
 * Fetches the people and groups matching the typed text, or with `cursor` the page after the one
 * that returned it; it should stop when `signal` aborts.
 */
export type PeoplePickerLoader = (
  query: string,
  signal: AbortSignal,
  cursor?: string,
) => Promise<readonly PeoplePickerPerson[] | PeoplePickerPage>;

export interface PeoplePickerProps<M extends ComboboxSelectionMode = 'single'>
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<
      ComboboxProps<M>,
      | 'selectionMode'
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'label'
      | 'description'
      | 'errorMessage'
      | 'placeholder'
      | 'isDisabled'
      | 'isReadOnly'
      | 'isInvalid'
      | 'isRequired'
      | 'searchDelay'
    > {
  /** Field size. Defaults to `md`. */
  size?: Extract<ControlSize, 'sm' | 'md' | 'lg'> | undefined;
  /** Searches people and groups as the reader types. Keep it stable: a new loader searches again. */
  loadItems: PeoplePickerLoader;
  /** The person using the app, listed first before a search and marked wherever listed. */
  currentUser?: PeoplePickerPerson | undefined;
  /** People chosen recently, listed under a heading before a search. */
  recent?: readonly PeoplePickerPerson[] | undefined;
}

const hooks = createHooks('people-picker', ['person', 'you', 'avatar']);

const identitySizes = { sm: 'xs', md: 'sm', lg: 'md' } as const satisfies Record<
  string,
  UserIdentitySize
>;

/** A person as an option: the name as label, and the avatar that the chip draws. */
function toOption(person: PeoplePickerPerson): ComboboxOption {
  const [identity] = splitAvatarIdentity(person);
  return {
    id: person.id,
    label: person.name,
    icon: <Avatar {...identity} size="xs" decorative className={hooks.slotClass('avatar')} />,
    isDisabled: person.isDisabled,
  };
}

/** The people listed before a search: the current user, then the recent ones under a heading. */
function toIdleItems(
  currentUser: PeoplePickerPerson | undefined,
  recent: readonly PeoplePickerPerson[],
  section: { id: string; title: string },
): ComboboxItem[] {
  const others = recent.filter((person) => person.id !== currentUser?.id);
  return [
    ...(currentUser ? [toOption(currentUser)] : []),
    ...(others.length > 0 ? [{ ...section, options: others.map(toOption) }] : []),
  ];
}

/** The caller's loader as the combobox's, remembering every person a search returns. */
function usePeopleSearch(loadItems: PeoplePickerLoader) {
  const [found, setFound] = useState<ReadonlyMap<Key, PeoplePickerPerson>>(() => new Map());
  const load = useCallback<ComboboxLoader>(
    async (query, signal, cursor) => {
      const result =
        cursor === undefined
          ? await loadItems(query, signal)
          : await loadItems(query, signal, cursor);
      const page = 'items' in result ? result : { items: result };
      if (!signal.aborted) {
        setFound((known) => new Map([...known, ...page.items.map((p) => [p.id, p] as const)]));
      }
      return { items: page.items.map(toOption), cursor: page.cursor };
    },
    [loadItems],
  );
  return { found, load };
}

function PersonRow({
  person,
  isCurrent,
  size,
}: {
  person: PeoplePickerPerson;
  isCurrent: boolean;
  size: UserIdentitySize;
}) {
  const strings = useUiStrings();
  const [identity, { description, isDisabled, disabledReason }] = splitAvatarIdentity(person);
  return (
    <UserIdentity
      {...identity}
      {...hooks.slot('person', { kind: identity.kind ?? 'person' })}
      size={size}
      description={isDisabled && disabledReason ? disabledReason : description}
      nameSuffix={
        isCurrent ? (
          <>
            {' '}
            <span {...hooks.slot('you')}>{strings.currentPerson}</span>
          </>
        ) : null
      }
    />
  );
}

/**
 * A field for choosing one or more people or groups, on `Combobox`: it searches through `loadItems`
 * as the reader types, lists the current user and recent people before a search, draws each person
 * with `UserIdentity`, and shows chosen people of a multiple picker as chips with their avatars.
 */
export function PeoplePicker<M extends ComboboxSelectionMode = 'single'>({
  loadItems,
  currentUser,
  recent = [],
  size = 'md',
  className,
  ...rest
}: PeoplePickerProps<M>) {
  const strings = useUiStrings();
  const sectionId = useId();
  const { found, load } = usePeopleSearch(loadItems);
  const people = new Map(found);
  for (const person of [...recent, ...(currentUser ? [currentUser] : [])]) {
    people.set(person.id, person);
  }
  return (
    <Combobox<M>
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      size={size}
      loadItems={load}
      items={toIdleItems(currentUser, recent, { id: sectionId, title: strings.recentPeople })}
      renderOption={(option) => {
        const person = people.get(option.id);
        return person ? (
          <PersonRow
            person={person}
            isCurrent={person.id === currentUser?.id}
            size={identitySizes[size]}
          />
        ) : (
          option.label
        );
      }}
    />
  );
}
