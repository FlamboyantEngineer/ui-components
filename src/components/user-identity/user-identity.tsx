import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toImageProps } from '../icon/icon.js';
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
  /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, …). */
  status?: string | undefined;
  /** Human-readable status, which names the status badge for assistive technology. */
  statusLabel?: string | undefined;
}

const hooks = createHooks('user-identity', [
  'avatar',
  'content',
  'title',
  'name',
  'description',
  'indicator',
]);

function isBlankNode(node: ReactNode): boolean {
  return isEmptyNode(node) || (typeof node === 'string' && node.trim() === '');
}

/**
 * A decorative avatar, a display name, an optional secondary line and an optional status badge, for
 * rows that name a person.
 */
export function UserIdentity(props: UserIdentityProps) {
  const [
    identity,
    { description, nameSuffix, size = 'md', colorCount, status, statusLabel, className, ...rest },
  ] = splitAvatarIdentity(props);
  const strings = useUiStrings();
  const statusValue = status?.trim() || undefined;
  return (
    <span {...rest} {...hooks.root({ className, data: { size, status: statusValue } })}>
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
      {/* After the text and a space, so the status is read after the name; the stylesheet places it
      on the avatar. */}
      {statusValue ? (
        <>
          {' '}
          <span {...hooks.slot('indicator')} {...toImageProps(statusLabel?.trim() || undefined)} />
        </>
      ) : null}
    </span>
  );
}
