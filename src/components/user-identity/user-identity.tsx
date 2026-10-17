import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  Avatar,
  getDisplayName,
  splitAvatarIdentity,
  type AvatarIdentity,
  type AvatarProps,
} from '../avatar/avatar.js';

export type UserIdentitySize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;

export interface UserIdentityProps
  extends AvatarIdentity, Pick<AvatarProps, 'colorCount'>, BaseProps {
  /** A secondary line under the name: an email, a role, a timestamp. Blank values draw no line. */
  description?: ReactNode;
  /** Content after the name on the same line, such as a badge. */
  nameSuffix?: ReactNode;
  /** Selects the avatar size. Defaults to `md`. */
  size?: UserIdentitySize | undefined;
}

const hooks = createHooks('user-identity', ['avatar', 'content', 'title', 'name', 'description']);

function isBlankNode(node: ReactNode): boolean {
  return isEmptyNode(node) || (typeof node === 'string' && node.trim() === '');
}

/** A decorative avatar, a display name and an optional secondary line, for rows that name a person. */
export function UserIdentity(props: UserIdentityProps) {
  const [identity, { description, nameSuffix, size = 'md', colorCount, className, ...rest }] =
    splitAvatarIdentity(props);
  const strings = useUiStrings();
  return (
    <span {...rest} {...hooks.root({ className, data: { size } })}>
      <Avatar
        {...identity}
        colorCount={colorCount}
        size={size}
        decorative
        className={hooks.slotClass('avatar')}
      />
      <span {...hooks.slot('content')}>
        <span {...hooks.slot('title')}>
          <span {...hooks.slot('name')}>{getDisplayName(identity.name, strings.unnamed)}</span>
          {nameSuffix}
        </span>
        {isBlankNode(description) ? null : (
          <span {...hooks.slot('description')}>{description}</span>
        )}
      </span>
    </span>
  );
}
