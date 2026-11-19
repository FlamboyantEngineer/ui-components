import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { avatarHooks as hooks } from './avatar-hooks.js';

/** The corner a badge sits on in the reading direction. */
export type AvatarBadgePlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** Attributes that choose or fetch the picture. */
export type AvatarImageAttributes = Pick<
  NativeProps<'img'>,
  'srcSet' | 'sizes' | 'crossOrigin' | 'referrerPolicy' | 'loading'
>;

export interface AvatarImageProps
  extends BaseProps, RefProps<HTMLImageElement>, AvatarImageAttributes {
  src?: string | undefined;
  /** Names the avatar when the root has no name. */
  alt?: string | undefined;
}

export interface AvatarFallbackProps extends BaseProps, RefProps<HTMLSpanElement> {
  children?: ReactNode;
}

export interface AvatarBadgeProps extends BaseProps, RefProps<HTMLSpanElement> {
  /** Adds the badge in words to the avatar's accessible name. */
  label?: string | undefined;
  /** Defaults to bottom-end, or top-end when presence takes that corner. */
  placement?: AvatarBadgePlacement | undefined;
  children?: ReactNode;
}

/** The picture of a composed avatar. The avatar owns its accessible name and load status. */
export function AvatarImage({ className, alt = '', ...rest }: AvatarImageProps) {
  return <img {...rest} {...hooks.slot('image', undefined, className)} alt={alt} />;
}

/** What a composed avatar draws while its image is missing, loading or has failed. */
export function AvatarFallback({ className, ...rest }: AvatarFallbackProps) {
  return <span {...rest} {...hooks.slot('fallback', undefined, className)} aria-hidden="true" />;
}

/** The corner a badge takes unless the presence indicator holds it. */
export function resolveBadgePlacement(
  placement: AvatarBadgePlacement | undefined,
  hasStatus: boolean,
): AvatarBadgePlacement {
  const asked = placement ?? 'bottom-end';
  return hasStatus && asked === 'bottom-end' ? 'top-end' : asked;
}

/** A decorative corner marker. The enclosing avatar announces its optional label. */
export function AvatarBadge({
  className,
  label: _label,
  placement,
  children,
  ...rest
}: AvatarBadgeProps) {
  if (isEmptyNode(children)) return null;
  return (
    <span
      {...rest}
      {...hooks.slot('badge', { placement: resolveBadgePlacement(placement, false) }, className)}
      aria-hidden="true"
      inert
    >
      {children}
    </span>
  );
}

interface AvatarParts {
  image?: AvatarImageProps;
  fallback?: AvatarFallbackProps;
  badge?: AvatarBadgeProps;
}

function takeAvatarParts(children: ReactNode, parts: AvatarParts) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment && isValidElement<{ children?: ReactNode }>(child)) {
      takeAvatarParts(child.props.children, parts);
    }
    if (child.type === AvatarImage && isValidElement<AvatarImageProps>(child))
      parts.image ??= child.props;
    if (child.type === AvatarFallback && isValidElement<AvatarFallbackProps>(child))
      parts.fallback ??= child.props;
    if (child.type === AvatarBadge && isValidElement<AvatarBadgeProps>(child))
      parts.badge ??= child.props;
  });
}

/** Reads the picture, fallback and badge supplied as children or within fragments. */
export function resolveAvatarParts(children: ReactNode): AvatarParts {
  const parts: AvatarParts = {};
  takeAvatarParts(children, parts);
  return parts;
}
