'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ControlSize, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  loadRemotePage,
  type RemoteLoader,
  type RemotePage,
} from '../../utils/use-remote-search.js';
import { Avatar, type AvatarIdentity, splitAvatarIdentity } from '../avatar/avatar.js';
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
export type PeoplePickerPage = RemotePage<PeoplePickerPerson>;

/**
 * Fetches the people and groups matching the typed text, or with `cursor` the page after the one
 * that returned it; it should stop when `signal` aborts.
 */
export type PeoplePickerLoader = RemoteLoader<PeoplePickerPerson>;

export interface PeoplePickerProps<M extends ComboboxSelectionMode = 'single'>
  extends
    RefProps<HTMLDivElement>,
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
      | 'minSearchLength'
      | 'name'
      | 'form'
      | 'autoFocus'
      | 'inputRef'
      | 'isOpen'
      | 'defaultOpen'
      | 'onOpenChange'
    > {
  /** Field size. Defaults to `md`. */
  size?: Extract<ControlSize, 'sm' | 'md' | 'lg'> | undefined;
  /** Searches people and groups as the reader types. Keep it stable: a new loader searches again. */
  loadItems: PeoplePickerLoader;
  /** The person using the app, listed first before a search and marked wherever listed. */
  currentUser?: PeoplePickerPerson | undefined;
  /** People chosen recently, listed under a heading before a search. */
  recent?: readonly PeoplePickerPerson[] | undefined;
  /** People listed before a search without a heading, such as those a saved value holds, so their names show without a search. */
  knownPeople?: readonly PeoplePickerPerson[] | undefined;
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

type People = ReadonlyMap<Key, PeoplePickerPerson>;

const noPeople: readonly PeoplePickerPerson[] = [];

/** The caller's people by id; the current user wins over a known person, who wins over a recent one. */
function toGivenPeople({
  currentUser,
  knownPeople = [],
  recent = [],
}: Pick<PeoplePickerProps, 'currentUser' | 'knownPeople' | 'recent'>): People {
  const given = new Map<Key, PeoplePickerPerson>();
  for (const person of [...recent, ...knownPeople, ...(currentUser ? [currentUser] : [])]) {
    given.set(person.id, person);
  }
  return given;
}

/**
 * What the picker knows of each person: the copy the latest search returned, else the caller's.
 * A search's copy is the newest, so it stays while the picker is mounted. Every row, label, chip
 * and disabled state reads this one copy.
 */
function useKnownPeople(given: People) {
  const [found, setFound] = useState<People>(() => new Map());
  const people = useMemo(() => new Map([...given, ...found]), [given, found]);
  const learn = useCallback((page: readonly PeoplePickerPerson[]) => {
    setFound((known) => new Map([...known, ...page.map((person) => [person.id, person] as const)]));
  }, []);
  return { people, learn };
}

/**
 * The ids listed before a search, each once: the current user, the known people, then the recent
 * ones under a heading.
 */
function toIdleItems(
  sources: Pick<PeoplePickerProps, 'currentUser' | 'knownPeople' | 'recent'>,
  people: People,
  section: { id: string; label: string },
): ComboboxItem[] {
  const { currentUser, knownPeople = [], recent = [] } = sources;
  const option = (id: Key) => toOption(requireDefined(people.get(id)));
  const known = knownPeople.filter((person) => person.id !== currentUser?.id);
  const listed = new Set([currentUser?.id, ...known.map((person) => person.id)]);
  const others = recent.filter((person) => !listed.has(person.id));
  return [
    ...(currentUser ? [option(currentUser.id)] : []),
    ...known.map((person) => option(person.id)),
    ...(others.length > 0
      ? [{ ...section, options: others.map((person) => option(person.id)) }]
      : []),
  ];
}

/** The caller's loader as the combobox's, telling `learn` every person a search returns. */
function usePeopleSearch(
  loadItems: PeoplePickerLoader,
  learn: (found: readonly PeoplePickerPerson[]) => void,
) {
  return useCallback<ComboboxLoader>(
    async (query, signal, cursor) => {
      const page = await loadRemotePage(loadItems, { query, signal, cursor });
      if (!signal.aborted) learn(page.items);
      return { items: page.items.map(toOption), cursor: page.cursor };
    },
    [loadItems, learn],
  );
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
 * as the reader types, lists the current user, known and recent people before a search, draws each person
 * with `UserIdentity`, and shows chosen people of a multiple picker as chips with their avatars.
 */
export function PeoplePicker<M extends ComboboxSelectionMode = 'single'>({
  loadItems,
  currentUser,
  recent = noPeople,
  knownPeople = noPeople,
  size = 'md',
  className,
  ...rest
}: PeoplePickerProps<M>) {
  const strings = useUiStrings();
  const sectionId = useId();
  const sources = { currentUser, knownPeople, recent };
  const given = useMemo(
    () => toGivenPeople({ currentUser, knownPeople, recent }),
    [currentUser, knownPeople, recent],
  );
  const { people, learn } = useKnownPeople(given);
  const load = usePeopleSearch(loadItems, learn);
  const knownOptions = useMemo(() => Array.from(people.values(), toOption), [people]);
  return (
    <Combobox<M>
      {...rest}
      className={mergeClassNames(hooks.className, className)}
      size={size}
      loadItems={load}
      items={toIdleItems(sources, people, { id: sectionId, label: strings.recentPeople })}
      knownOptions={knownOptions}
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
