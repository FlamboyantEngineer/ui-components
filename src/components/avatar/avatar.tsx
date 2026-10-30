'use client';

import { UsersGlyph } from '../../core/glyphs.js';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { getInitials } from '../../utils/initials.js';
import type { PressEvent } from '../../core/events.js';
import { toImageProps } from '../icon/icon.js';
import { AvatarRoot } from './avatar-root.js';
import { Tooltip } from '../tooltip/tooltip.js';
import type { UserCardTriggerType } from '../user-card/user-card.js';

/** Circle size. `fill` takes the whole box its container gives it. */
export type AvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'> | 'fill';

/** `filled` sets initials on the colour slot; `outlined` rings the circle and leaves the ground to the host. */
export type AvatarVariant = 'filled' | 'outlined';

/** A group draws a decorative group glyph instead of a picture or initials. */
export type AvatarKind = 'person' | 'group';

/** `circle` for people; `rounded` or `square` for bots, organisations and groups. */
export type AvatarShape = 'circle' | 'rounded' | 'square';

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

export interface AvatarProps extends AvatarIdentity, BaseProps {
  /** Optional presence status, such as active, away, busy or idle. */
  status?: string | undefined;
  /** Human-readable status added to the accessible name. */
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
  status: AvatarLoadingStatus;
  settle: (status: 'loaded' | 'error') => void;
  imageRef: (image: HTMLImageElement | null) => void;
}

/** The number of colour slots a derived colour is spread over unless `colorCount` says otherwise. */
export const DEFAULT_AVATAR_COLOR_COUNT = 8;

const hooks = createHooks('avatar', ['image', 'initials', 'glyph', 'surface', 'indicator']);

function paletteSize(colorCount: number | undefined): number {
  return colorCount !== undefined && Number.isFinite(colorCount) && colorCount >= 1
    ? Math.trunc(colorCount)
    : DEFAULT_AVATAR_COLOR_COUNT;
}

/** The picture an identity draws: its trimmed `src`, or none for a group or a blank address. */
function pictureOf({ src, kind }: Pick<AvatarIdentity, 'src' | 'kind'>): string {
  return kind === 'group' ? '' : (src?.trim() ?? '');
}

/** Tracks whether `picture` has loaded or failed; a different address starts loading afresh. */
function useAvatarPicture(
  picture: string,
  onLoadingStatusChange: AvatarProps['onLoadingStatusChange'],
): AvatarPicture {
  const [settled, setSettled] = useState<{ src: string; status: 'loaded' | 'error' } | null>(null);
  const status: AvatarLoadingStatus =
    picture === '' ? 'idle' : settled?.src === picture ? settled.status : 'loading';
  const settle = useCallback(
    (next: 'loaded' | 'error') =>
      setSettled((previous) =>
        previous?.src === picture && previous.status === next
          ? previous
          : { src: picture, status: next },
      ),
    [picture],
  );
  // A picture the browser already holds, such as one loaded before hydration, may fire no load
  // event to the handler.
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth > 0) settle('loaded');
    },
    [settle],
  );
  const reported = useRef<AvatarLoadingStatus | null>(null);
  useEffect(() => {
    if (reported.current === status) return;
    reported.current = status;
    onLoadingStatusChange?.(status);
  });
  return { status, settle, imageRef };
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
  if (kind === 'group') return <Glyph icon={UsersGlyph} className={hooks.slotClass('glyph')} />;
  if (picture.status === 'loading' || picture.status === 'loaded') {
    return (
      <img
        {...imageProps}
        {...hooks.slot('image')}
        ref={picture.imageRef}
        src={src?.trim()}
        alt=""
        onLoad={() => picture.settle('loaded')}
        onError={() => picture.settle('error')}
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
 * The colour slot an avatar publishes: the explicit `colorIndex` wrapped into the palette, otherwise
 * the slot derived from `colorKey` (or `name` when the key is blank). Groups have no derived colour.
 */
export function resolveAvatarColor(
  identity: Pick<AvatarIdentity, 'name' | 'colorKey' | 'colorIndex' | 'kind'>,
  colorCount?: number,
): number | undefined {
  const slots = paletteSize(colorCount);
  const { colorIndex } = identity;
  if (colorIndex !== undefined && Number.isFinite(colorIndex)) {
    return ((Math.trunc(colorIndex) % slots) + slots) % slots;
  }
  if (identity.kind === 'group') return undefined;
  const key = identity.colorKey?.trim() ? identity.colorKey : identity.name;
  return getColorIndex(key, slots);
}

/** The full name, including optional status, is shared by the root and its name tooltip. */
function useAvatarPresentation(
  props: Pick<
    AvatarProps,
    'name' | 'label' | 'statusLabel' | 'nameTooltip' | 'card' | 'cardTrigger' | 'onPress'
  >,
) {
  const strings = useUiStrings();
  const displayName = getDisplayName(props.name, strings.unnamed);
  const accessibleName =
    props.label?.trim() ||
    (props.statusLabel?.trim()
      ? strings.nameWithStatus(displayName, props.statusLabel.trim())
      : displayName);
  return {
    accessibleName,
    surfaceProps: toImageProps(props.card || props.onPress ? accessibleName : undefined),
    hasTooltip: props.nameTooltip && !(props.card && props.cardTrigger === 'hover'),
  };
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
      className,
      ...rest
    },
  ] = splitAvatarIdentity(props);
  const picture = useAvatarPicture(pictureOf(identity), onLoadingStatusChange);
  const color = resolveAvatarColor(identity, colorCount);
  const { accessibleName, hasTooltip, surfaceProps } = useAvatarPresentation({
    name: identity.name,
    label,
    statusLabel,
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
          status: status?.trim() || undefined,
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
      {status?.trim() ? <span {...hooks.slot('indicator')} aria-hidden="true" /> : null}
    </AvatarRoot>
  );
  return hasTooltip ? <Tooltip content={accessibleName}>{element}</Tooltip> : element;
}
