import { isValidElement } from 'react';
import type { IconProps, IconSource } from './icon.js';

/** Whether an icon source draws an icon: `undefined`, `null` and `false` all mean none. */
export function hasIcon(
  source: IconSource,
): source is Exclude<IconSource, null | undefined | false> {
  return source !== undefined && source !== null && source !== false;
}

/** Image semantics for a drawing: an image named by `label`, or hidden from assistive technology. */
export function toImageProps(
  label: string | undefined,
): { role: 'img'; 'aria-label': string } | { 'aria-hidden': true } {
  return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
}

/** Passes components as `icon` and rendered elements as `children`. */
export function toIconProps(source: IconSource): Pick<IconProps, 'icon' | 'children'> {
  return !source || isValidElement(source) ? { children: source } : { icon: source };
}
