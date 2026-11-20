'use client';

import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { avatarGroupHooks as hooks } from './avatar-group-hooks.js';

export interface AvatarGroupCountProps extends BaseProps, RefProps<HTMLSpanElement> {
  /** The number of people omitted from the avatars. */
  count: number;
  /** The names of the omitted people, if available. */
  hiddenNames?: readonly string[] | undefined;
  /** An accessible name, when it should say more than the count and names. */
  label?: string | undefined;
  /** Hide the count from assistive technology. */
  decorative?: boolean | undefined;
}

/** The count of omitted people, labelled with their names when available. */
export function AvatarGroupCount({
  count,
  hiddenNames = [],
  label,
  decorative,
  className,
  ...rest
}: AvatarGroupCountProps) {
  const strings = useUiStrings();
  if (!Number.isFinite(count) || count < 1) return null;
  const total = Math.trunc(count);
  return (
    <span
      {...rest}
      {...hooks.slot('overflow', undefined, className)}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': label || strings.morePeople(total, hiddenNames) })}
    >
      {strings.overflowCount(total)}
    </span>
  );
}
