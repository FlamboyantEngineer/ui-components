'use client';

import { UsersGlyph } from '../../core/glyphs.js';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, PresenceStatus, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { getInitials } from '../../utils/initials.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import type { PressEvent } from '../../core/events.js';
import { toImageProps } from '../icon/icon.js';
import { AvatarRoot } from './avatar-root.js';
import { resolveAvatarColor } from './avatar-color.js';
import { Tooltip } from '../tooltip/tooltip.js';
import type { UserCardTriggerType } from '../user-card-trigger/user-card-trigger.js';

/** Circle size. `fill` takes the whole box its container gives it. */
export type AvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'> | 'fill';

/** `filled` sets initials on the colour slot; `outlined` rings the circle and leaves the ground to the host. */
export type AvatarVariant = 'filled' | 'outlined';

/** A group draws a decorative group glyph instead of a picture or initials. */
export type AvatarKind = 'person' | 'group';

/** `circle` for people; `rounded` or `square` for bots, organisations and groups. */
export type AvatarShape = 'circle' | 'rounded' | 'square';

/**
 * The corner a badge sits on, in the reading direction. With a status, `bottom-end` gives way to
 * the status indicator and the badge takes `top-end`.
 */
export type AvatarBadgePlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** A small marker on a corner of the avatar, such as a country flag, and the words that name it. */
export interface AvatarBadgeProps {
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

/** Attributes for the picture's `<img>` besides its address. */
export type AvatarImageProps = Pick<
  NativeProps<'img'>,
  'srcSet' | 'sizes' | 'crossOrigin' | 'referrerPolicy' | 'loading'
>;

/** The identity fields every component that draws an avatar accepts and hands to it unchanged. */
export interface AvatarIdentity {
  /** Display name. The initials, the derived colour and the accessible name come from it. */
  name: string;
  /** Picture URL. A picture that fails to load falls back to the initials. */
  src?: string | undefined;
  /** The picture's `srcSet`, `sizes`, `crossOrigin`, `referrerPolicy` and `loading` attributes. */
  imageProps?: AvatarImageProps | undefined;
  /** Initials to show instead of the ones derived from `name`. */
  initials?: string | undefined;
  /** Stable key for the derived colour, such as an id, so a renamed person keeps their colour. Defaults to `name`. */
  colorKey?: string | undefined;
  /** An explicit colour slot, wrapped into the palette. Wins over the derived slot. */
  colorIndex?: number | undefined;
  /** Defaults to `person`. */
  kind?: AvatarKind | undefined;
  /** Defaults to `circle`. */
  shape?: AvatarShape | undefined;
}

export interface AvatarProps extends AvatarIdentity, AvatarBadgeProps, BaseProps {
  /** The person's presence, published as `data-status`. */
  status?: PresenceStatus | undefined;
  /** The status in words, added to the accessible name. Defaults to the provider's `presenceStatus`. */
  statusLabel?: string | undefined;
  /** Makes the avatar a pressable command. */
  onPress?: ((event: PressEvent) => void) | undefined;
  /** A person card opened by this avatar. */
  card?: ReactNode;
  /** Defaults to press; hover also opens on keyboard focus. */
  cardTrigger?: UserCardTriggerType | undefined;
  /** Shows the accessible name in a tooltip, also reachable with the keyboard. */
  nameTooltip?: boolean | undefined;
  /** Defaults to `md`. */
  size?: AvatarSize | undefined;
  /** Defaults to `filled`. */
  variant?: AvatarVariant | undefined;
  /** How many colour slots the host stylesheet defines. Defaults to `DEFAULT_AVATAR_COLOR_COUNT`. */
  colorCount?: number | undefined;
  /** Accessible name, when it should say more than `name` (`Maria Santos, Away`). Defaults to `name`. */
  label?: string | undefined;
  /** Hide the avatar from assistive technology when visible text next to it already names the person. */
  decorative?: boolean | undefined;
  /** Called with the picture's loading status, first on mount and then whenever it changes. */
  onLoadingStatusChange?: ((status: AvatarLoadingStatus) => void) | undefined;
}

/** The picture's loading state and the handlers that settle it. */
interface AvatarPicture {
  /** Counts the image requests, so each gets its own element. */
  generation: number;
  status: AvatarLoadingStatus;
  settle: (status: 'loaded' | 'error') => void;
  imageRef: (image: HTMLImageElement | null) => void;
}

const hooks = createHooks('avatar', [
  'image',
  'initials',
  'glyph',
  'surface',
  'indicator',
  'badge',
]);

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

/**
 * Tracks whether the image `request` has loaded or failed; a different request (compared item by
 * item) starts loading afresh.
 */
function useAvatarPicture(
  requested: readonly unknown[],
  onLoadingStatusChange: AvatarProps['onLoadingStatusChange'],
): AvatarPicture {
  const request = useStableArray(requested);
  const [tracked, setTracked] = useState({ request, generation: 0 });
  if (tracked.request !== request) setTracked({ request, generation: tracked.generation + 1 });
  const generation = tracked.request === request ? tracked.generation : tracked.generation + 1;
  const [settled, setSettled] = useState<{
    generation: number;
    status: 'loaded' | 'error';
  } | null>(null);
  const status: AvatarLoadingStatus =
    request.length === 0 ? 'idle' : settled?.generation === generation ? settled.status : 'loading';
  const settle = useCallback(
    (next: 'loaded' | 'error') =>
      setSettled((previous) =>
        previous?.generation === generation && previous.status === next
          ? previous
          : { generation, status: next },
      ),
    [generation],
  );
  // An image the browser settled before the handlers were attached, such as before hydration,
  // fires no event to them. A lazy image that has not started is not complete, so it stays loading.
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image?.complete) return;
      if (image.naturalWidth > 0) settle('loaded');
      // An image without intrinsic size, such as some SVG, has no width once loaded either.
      else if (typeof image.decode === 'function') {
        // Each request has its own image element, so one that has left answers nothing.
        const answer = (next: 'loaded' | 'error') => image.isConnected && settle(next);
        image.decode().then(
          () => answer('loaded'),
          () => answer('error'),
        );
      } else settle('error');
    },
    [settle],
  );
  const reported = useRef<AvatarLoadingStatus | null>(null);
  useEffect(() => {
    if (reported.current === status) return;
    reported.current = status;
    onLoadingStatusChange?.(status);
  });
  return { generation, status, settle, imageRef };
}

/** The group glyph, the picture, or the initials without a picture or once it has failed. */
function AvatarContent({
  identity,
  picture,
}: {
  identity: AvatarIdentity;
  picture: AvatarPicture;
}) {
  const { name, src, imageProps, initials, kind } = identity;
  const { status, generation, imageRef, settle } = picture;
  if (kind === 'group') return <Glyph icon={UsersGlyph} className={hooks.slotClass('glyph')} />;
  if (status === 'loading' || status === 'loaded') {
    return (
      <img
        {...imageProps}
        // A new element per request, so events of a departed request never reach the handlers.
        key={generation}
        {...hooks.slot('image')}
        ref={imageRef}
        src={src?.trim()}
        alt=""
        onLoad={() => settle('loaded')}
        onError={() => settle('error')}
      />
    );
  }
  return (
    <span {...hooks.slot('initials')} aria-hidden="true">
      {initials?.trim() || getInitials(name)}
    </span>
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
 * Avatar, UserIdentity and UserCard name a status the same way.
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
    | 'name'
    | 'label'
    | 'status'
    | 'statusLabel'
    | 'badgeLabel'
    | 'nameTooltip'
    | 'card'
    | 'cardTrigger'
    | 'onPress'
  >,
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

/** The corner a badge takes: the one asked for, unless the status indicator holds it. */
export function resolveBadgePlacement(
  placement: AvatarBadgePlacement | undefined,
  hasStatus: boolean,
): AvatarBadgePlacement {
  const asked = placement ?? 'bottom-end';
  return hasStatus && asked === 'bottom-end' ? 'top-end' : asked;
}

/** The badge on its corner, hidden and inert: the avatar's name says what it means. */
function AvatarBadge({
  badge,
  badgePlacement,
  hasStatus,
}: Pick<AvatarProps, 'badge' | 'badgePlacement'> & { hasStatus: boolean }) {
  if (isEmptyNode(badge)) return null;
  const placement = resolveBadgePlacement(badgePlacement, hasStatus);
  return (
    <span {...hooks.slot('badge', { placement })} aria-hidden="true" inert>
      {badge}
    </span>
  );
}

/** A person's picture, or their initials on a stable colour slot; a group glyph for a group. */
export function Avatar(props: AvatarProps) {
  const [
    identity,
    {
      size = 'md',
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
  ] = splitAvatarIdentity(props);
  const picture = useAvatarPicture(requestOf(identity), onLoadingStatusChange);
  const color = resolveAvatarColor(identity, colorCount);
  const { accessibleName, hasTooltip, surfaceProps } = useAvatarPresentation({
    name: identity.name,
    label,
    status,
    statusLabel,
    badgeLabel,
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
      onPress={onPress}
      card={card}
      cardTrigger={cardTrigger}
      isFocusable={Boolean(hasTooltip)}
      aria-describedby={hasTooltip ? '' : undefined}
    >
      <span {...hooks.slot('surface')} {...surfaceProps}>
        <AvatarContent identity={identity} picture={picture} />
      </span>
      {status ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
      <AvatarBadge badge={badge} badgePlacement={badgePlacement} hasStatus={Boolean(status)} />
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

export { resolveAvatarColor, DEFAULT_AVATAR_COLOR_COUNT } from './avatar-color.js';
