'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { PressEvent } from '../../core/events.js';
import { UsersGlyph } from '../../core/glyphs.js';
import type { BaseProps, PresenceStatus, RefProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { getInitials } from '../../utils/initials.js';
import { type ImageLoading, useImageLoading } from '../../utils/use-image-loading.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import type { PreviewTriggerType } from '../hover-card/hover-card.js';
import { toImageProps } from '../icon/icon.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { resolveAvatarColor } from './avatar-color.js';
import { avatarHooks as hooks } from './avatar-hooks.js';
import {
  AvatarBadge,
  type AvatarBadgePlacement,
  type AvatarBadgeProps,
  AvatarFallback,
  type AvatarFallbackProps,
  type AvatarImageAttributes,
  type AvatarImageProps,
  resolveAvatarParts,
  resolveBadgePlacement,
} from './avatar-parts.js';
import { AvatarRoot } from './avatar-root.js';

/** Circle size. `fill` takes the whole box its container gives it. */
export type AvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'> | 'fill';

/** `filled` sets initials on the color slot; `outlined` rings the circle and leaves the ground to the host. */
export type AvatarVariant = 'filled' | 'outlined';

/** A group draws a decorative group glyph instead of a picture or initials. */
export type AvatarKind = 'person' | 'group';

/** `circle` for people; `rounded` or `square` for bots, organisations and groups. */
export type AvatarShape = 'circle' | 'rounded' | 'square';

/** A small marker on a corner of the avatar, such as a country flag, and the words that name it. */
interface AvatarBadgeOptions {
  /**
   * Caller content drawn on a corner, outside the clipped picture: a flag image, an emoji or a
   * glyph. It is decorative and inert, so it must not hold controls.
   */
  badge?: ReactNode;
  /** The badge in words (`France`), added to the avatar's name. Without it the badge is decorative. */
  badgeLabel?: string | undefined;
  /** Defaults to `bottom-end`, or `top-end` when a status takes that corner. */
  badgePlacement?: AvatarBadgePlacement | undefined;
}

/** No picture to load (`idle`), or the picture is loading, has loaded or has failed. */
export type AvatarLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** The identity fields every component that draws an avatar accepts and hands to it unchanged. */
export interface AvatarIdentity {
  /** Display name. The initials, the derived color and the accessible name come from it. */
  name: string;
  /** Picture URL. A picture that fails to load falls back to the initials. */
  src?: string | undefined;
  /** The picture's `srcSet`, `sizes`, `crossOrigin`, `referrerPolicy` and `loading` attributes. */
  imageProps?: AvatarImageAttributes | undefined;
  /** Initials to show instead of the ones derived from `name`. */
  initials?: string | undefined;
  /** Stable key for the derived color, such as an id, so a renamed person keeps their color. Defaults to `name`. */
  colorKey?: string | undefined;
  /** An explicit color slot, wrapped into the palette. Wins over the derived slot. */
  colorIndex?: number | undefined;
  /** Defaults to `person`. */
  kind?: AvatarKind | undefined;
  /** Defaults to `circle`. */
  shape?: AvatarShape | undefined;
}

export interface AvatarProps
  extends
    RefProps<HTMLSpanElement | HTMLButtonElement>,
    Omit<AvatarIdentity, 'name'>,
    AvatarBadgeOptions,
    BaseProps {
  /** The display name. A composed image's alt text supplies it when omitted. */
  name?: string | undefined;
  /** One AvatarImage, AvatarFallback or AvatarBadge of each kind, composed in a client component. */
  children?: ReactNode;
  /** The person's presence, published as `data-status`. */
  status?: PresenceStatus | undefined;
  /** The status in words, added to the accessible name. Defaults to the provider's `presenceStatus`. */
  statusLabel?: string | undefined;
  /** Makes the avatar a pressable command. */
  onPress?: ((event: PressEvent) => void) | undefined;
  /** A person card opened by this avatar. */
  card?: ReactNode;
  /** Defaults to press; hover also opens on keyboard focus. */
  cardTrigger?: PreviewTriggerType | undefined;
  /** Shows the accessible name in a tooltip, also reachable with the keyboard. */
  nameTooltip?: boolean | undefined;
  /** Defaults to `md`. */
  size?: AvatarSize | undefined;
  /** Defaults to `filled`. */
  variant?: AvatarVariant | undefined;
  /** How many color slots the host stylesheet defines. Defaults to `DEFAULT_AVATAR_COLOR_COUNT`. */
  colorCount?: number | undefined;
  /** Accessible name, when it should say more than `name` (`Maria Santos, Away`). Defaults to `name`. */
  label?: string | undefined;
  /** Hide the avatar from assistive technology when visible text next to it already names the person. */
  decorative?: boolean | undefined;
  /** Called with the picture's loading status, first on mount and then whenever it changes. */
  onLoadingStatusChange?: ((status: AvatarLoadingStatus) => void) | undefined;
}

export const AvatarSizeContext = createContext<AvatarSize>('md');

/** The picture an identity draws: its trimmed `src`, or none for a group or a blank address. */
function pictureOf({ src, kind }: Pick<AvatarIdentity, 'src' | 'kind'>): string {
  return kind === 'group' ? '' : (src?.trim() ?? '');
}

/**
 * What decides the image the browser requests: the picture and the attributes that choose or fetch
 * a candidate. Empty without a picture.
 */
function requestOf(identity: Pick<AvatarIdentity, 'src' | 'kind' | 'imageProps'>): unknown[] {
  const picture = pictureOf(identity);
  if (picture === '') return [];
  const { srcSet, sizes, crossOrigin, referrerPolicy } = identity.imageProps ?? {};
  return [picture, srcSet, sizes, crossOrigin, referrerPolicy];
}

function AvatarContent({
  identity,
  picture,
  image,
  fallback,
}: {
  identity: AvatarIdentity;
  picture: ImageLoading;
  image?: AvatarImageProps | undefined;
  fallback?: AvatarFallbackProps | undefined;
}) {
  const { name, src, imageProps, initials, kind } = identity;
  const { status, generation, imageRef, settle } = picture;
  const combinedRef = useMergedRefs(imageRef, image?.ref);
  const hasPicture = status === 'loading' || status === 'loaded';
  if (kind === 'group') return <Glyph icon={UsersGlyph} className={hooks.slotClass('glyph')} />;
  return (
    <>
      {hasPicture ? (
        <img
          {...imageProps}
          {...image}
          // A new element per request, so events of a departed request never reach the handlers.
          key={generation}
          {...hooks.slot('image', { state: status }, image?.className)}
          ref={combinedRef}
          src={src?.trim()}
          alt=""
          onLoad={() => settle('loaded')}
          onError={() => settle('error')}
        />
      ) : null}
      {fallback && status !== 'loaded' ? (
        <AvatarFallback {...fallback} />
      ) : !hasPicture ? (
        <span {...hooks.slot('initials')} aria-hidden="true">
          {initials?.trim() || getInitials(name)}
        </span>
      ) : null}
    </>
  );
}

/** The name a person is shown and announced by: the trimmed `name`, or `unnamed` when it is blank. */
export function getDisplayName(name: string, unnamed: string): string {
  return name.trim() || unnamed;
}

/** Splits a component's props into the avatar identity fields, to hand to an avatar, and the rest. */
export function splitAvatarIdentity<P extends AvatarIdentity>(
  props: P,
): [AvatarIdentity, Omit<P, keyof AvatarIdentity>] {
  const { name, src, imageProps, initials, colorKey, colorIndex, kind, shape, ...rest } = props;
  return [{ name, src, imageProps, initials, colorKey, colorIndex, kind, shape }, rest];
}

/**
 * A presence in words: the caller's `statusLabel`, or the provider's `presenceStatus` of `status`.
 * Avatar and UserIdentity name a status the same way.
 */
export function resolveStatusLabel(
  { status, statusLabel }: Pick<AvatarProps, 'status' | 'statusLabel'>,
  strings: UiStrings,
): string | undefined {
  return statusLabel?.trim() || (status ? strings.presenceStatus(status) : undefined);
}

/** The full name, including optional status, is shared by the root and its name tooltip. */
function useAvatarPresentation(
  props: Pick<
    AvatarProps,
    | 'label'
    | 'status'
    | 'statusLabel'
    | 'badgeLabel'
    | 'nameTooltip'
    | 'card'
    | 'cardTrigger'
    | 'onPress'
  > &
    Pick<AvatarIdentity, 'name'>,
) {
  const strings = useUiStrings();
  const named = [resolveStatusLabel(props, strings), props.badgeLabel?.trim()].reduce(
    (name: string, detail) => (detail ? strings.nameWithStatus(name, detail) : name),
    getDisplayName(props.name, strings.unnamed),
  );
  const accessibleName = props.label?.trim() || named;
  return {
    accessibleName,
    surfaceProps: toImageProps(props.card || props.onPress ? accessibleName : undefined),
    hasTooltip: props.nameTooltip && !(props.card && props.cardTrigger === 'hover'),
  };
}

function toAvatarIdentityProps(
  { name, ...props }: Omit<AvatarProps, 'children'>,
  image: AvatarImageProps | undefined,
) {
  const displayName = name?.trim() ? name : (image?.alt ?? '');
  if (!image) return { ...props, name: displayName };
  const { src, srcSet, sizes, crossOrigin, referrerPolicy, loading } = image;
  return {
    ...props,
    name: displayName,
    src,
    imageProps: { srcSet, sizes, crossOrigin, referrerPolicy, loading },
  };
}

function toAvatarBadgeProps(
  part: AvatarBadgeProps | undefined,
  { badge, badgeLabel, badgePlacement, status }: AvatarBadgeOptions & Pick<AvatarProps, 'status'>,
): AvatarBadgeProps {
  return {
    ...part,
    label: part ? part.label : badgeLabel,
    placement: resolveBadgePlacement(part?.placement ?? badgePlacement, Boolean(status)),
    children: part ? part.children : badge,
  };
}

/** A person's picture, or their initials on a stable color slot; a group glyph for a group. */
export function Avatar({ children, ...props }: AvatarProps) {
  const parts = resolveAvatarParts(children);
  const inheritedSize = useContext(AvatarSizeContext);
  const [
    identity,
    {
      size = inheritedSize,
      variant = 'filled',
      colorCount,
      label,
      decorative,
      onLoadingStatusChange,
      status,
      statusLabel,
      onPress,
      card,
      cardTrigger,
      nameTooltip,
      badge,
      badgeLabel,
      badgePlacement,
      className,
      ...rest
    },
  ] = splitAvatarIdentity(toAvatarIdentityProps(props, parts.image));
  const badgeProps = toAvatarBadgeProps(parts.badge, { badge, badgeLabel, badgePlacement, status });
  const picture = useImageLoading(requestOf(identity), onLoadingStatusChange);
  const color = resolveAvatarColor(identity, colorCount);
  const { accessibleName, hasTooltip, surfaceProps } = useAvatarPresentation({
    name: identity.name,
    label,
    status,
    statusLabel,
    badgeLabel: badgeProps.label,
    nameTooltip,
    card,
    cardTrigger,
    onPress,
  });
  const element = (
    <AvatarRoot
      {...rest}
      {...hooks.root({
        className,
        data: {
          size,
          variant,
          kind: identity.kind ?? 'person',
          shape: identity.shape ?? 'circle',
          color,
          loading: picture.status === 'loading',
          status,
        },
      })}
      imageLabel={decorative ? undefined : accessibleName}
      previewLabel={identity.name}
      onPress={onPress}
      card={card}
      cardTrigger={cardTrigger}
      isFocusable={Boolean(hasTooltip)}
      aria-describedby={hasTooltip ? '' : undefined}
    >
      <span {...hooks.slot('surface')} {...surfaceProps}>
        <AvatarContent {...parts} identity={identity} picture={picture} />
      </span>
      {status ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
      <AvatarBadge {...badgeProps} />
    </AvatarRoot>
  );
  // A pressable avatar keeps its tooltip trigger while the tooltip is off, so turning it on or off
  // keeps the button and its focus.
  return hasTooltip || card || onPress ? (
    <Tooltip content={accessibleName} isDisabled={!hasTooltip}>
      {element}
    </Tooltip>
  ) : (
    element
  );
}

export { DEFAULT_AVATAR_COLOR_COUNT, resolveAvatarColor } from './avatar-color.js';
export type {
  AvatarBadgePlacement,
  AvatarBadgeProps,
  AvatarFallbackProps,
  AvatarImageAttributes,
  AvatarImageProps,
} from './avatar-parts.js';
export { AvatarBadge, AvatarFallback, AvatarImage, resolveBadgePlacement } from './avatar-parts.js';
