'use client';

import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton } from '../../primitives/index.js';
import type { KeyedValue } from '../../utils/stable-keys.js';
import { splitAvatarIdentity } from '../avatar/avatar.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import type { AvatarGroupPerson, AvatarGroupProps } from './avatar-group.js';
import { avatarGroupHooks as hooks } from './avatar-group-hooks.js';

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

/** Opens the full list from the non-interactive stack's content. */
export function AvatarGroupListTrigger({
  people,
  colorCount,
  children,
}: Pick<AvatarGroupProps, 'colorCount'> & {
  people: Array<KeyedValue<AvatarGroupPerson>>;
  children: ReactNode;
}) {
  const strings = useUiStrings();
  return (
    <PopoverTrigger>
      <AriaButton {...hooks.slot('trigger')}>{children}</AriaButton>
      <Popover
        title={strings.peopleCount(people.length)}
        placement="bottom start"
        className={hooks.slotClass('popover')}
      >
        <AvatarGroupList people={people} colorCount={colorCount} />
      </Popover>
    </PopoverTrigger>
  );
}
