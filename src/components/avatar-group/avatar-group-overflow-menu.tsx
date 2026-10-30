'use client';

import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { KeyedValue } from '../../utils/stable-keys.js';
import { getDisplayName, splitAvatarIdentity, type AvatarProps } from '../avatar/avatar.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import type { AvatarGroupPerson } from './avatar-group.js';

interface AvatarGroupOverflowMenuProps extends Pick<AvatarProps, 'colorCount'> {
  /** The `+N` count. */
  count: number;
  /** Names the button: the count and the names it hides. */
  label: string;
  /** The people past `maxVisible`, keyed for the menu. */
  hidden: Array<KeyedValue<AvatarGroupPerson>>;
  /** Reports the chosen person's id. */
  onAction?: ((id: string) => void) | undefined;
}

const hooks = createHooks('avatar-group', ['overflow', 'menu']);

/** The `+N` count as a button that opens a menu of the people it hides. */
export function AvatarGroupOverflowMenu({
  count,
  label,
  hidden,
  colorCount,
  onAction,
}: AvatarGroupOverflowMenuProps) {
  const strings = useUiStrings();
  const ids = new Map(hidden.map(({ key, value }) => [key, value.id]));
  return (
    <MenuTrigger>
      <AriaButton {...hooks.slot('overflow')} aria-label={label}>
        {`+${count}`}
      </AriaButton>
      <MenuPopover placement="bottom start">
        <Menu
          className={hooks.slotClass('menu')}
          aria-label={strings.morePeople(count, [])}
          onAction={(key) => {
            const id = ids.get(String(key));
            if (id !== undefined) onAction?.(id);
          }}
        >
          {hidden.map(({ key, value }) => {
            const [identity] = splitAvatarIdentity(value);
            // Named by its content: the name, then the status badge's label.
            return (
              <MenuItem key={key} id={key} textValue={getDisplayName(value.name, strings.unnamed)}>
                {() => (
                  <UserIdentity
                    {...identity}
                    colorCount={colorCount}
                    size="sm"
                    status={value.status}
                    statusLabel={value.statusLabel}
                  />
                )}
              </MenuItem>
            );
          })}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}
