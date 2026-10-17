import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, type AvatarIdentity } from '../avatar/avatar.js';

export type UserIdentitySize = 'xs' | 'sm' | 'md' | 'lg';

export interface UserIdentityProps extends AvatarIdentity {
  /** A secondary line under the name: an email, a role, a timestamp. Blank values draw no line. */
  description?: ReactNode;
  /** Content after the name on the same line, such as a badge. */
  nameSuffix?: ReactNode;
  /** Selects the avatar size. Defaults to `md`. */
  size?: UserIdentitySize | undefined;
  /** How many colour slots the host stylesheet defines, passed to the avatar. */
  colorCount?: number | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('user-identity', ['avatar', 'content', 'title', 'name', 'description']);

function hasContent(node: ReactNode): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') return false;
  return typeof node !== 'string' || node.trim().length > 0;
}

/** A decorative avatar, a display name and an optional secondary line, for rows that name a person. */
export function UserIdentity({
  name,
  src,
  initials,
  colorKey,
  colorIndex,
  kind = 'person',
  description,
  nameSuffix,
  size = 'md',
  colorCount,
  className,
  id,
  ...rest
}: UserIdentityProps) {
  const strings = useUiStrings();
  return (
    <span {...hooks.root({ className, props: rest, data: { size } })} id={id}>
      <Avatar
        name={name}
        src={src}
        initials={initials}
        colorKey={colorKey}
        colorIndex={colorIndex}
        colorCount={colorCount}
        kind={kind}
        size={size}
        decorative
        className={hooks.slotClass('avatar')}
      />
      <span {...hooks.slot('content')}>
        <span {...hooks.slot('title')}>
          <span {...hooks.slot('name')}>{name.trim() || strings.unnamed}</span>
          {nameSuffix}
        </span>
        {hasContent(description) ? <span {...hooks.slot('description')}>{description}</span> : null}
      </span>
    </span>
  );
}
