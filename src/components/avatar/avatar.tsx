import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { getInitials } from '../../utils/initials.js';

/** Circle size. `fill` takes the whole box its container gives it. */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'fill';

/** `filled` sets initials on the colour slot; `outlined` rings the circle and leaves the ground to the host. */
export type AvatarVariant = 'filled' | 'outlined';

/** A group draws a decorative group glyph instead of a picture or initials. */
export type AvatarKind = 'person' | 'group';

/** The number of colour slots a derived colour is spread over unless `colorCount` says otherwise. */
export const DEFAULT_AVATAR_COLOR_COUNT = 8;

/** The identity fields every component that draws an avatar accepts. */
export interface AvatarIdentity {
  /** Display name. The initials, the derived colour and the accessible name come from it. */
  name: string;
  /** Picture URL. A picture that fails to load falls back to the initials. */
  src?: string | undefined;
  /** Initials to show instead of the ones derived from `name`. */
  initials?: string | undefined;
  /** Stable key for the derived colour, such as an id, so a renamed person keeps their colour. Defaults to `name`. */
  colorKey?: string | undefined;
  /** An explicit colour slot, wrapped into the palette. Wins over the derived slot. */
  colorIndex?: number | undefined;
  /** Defaults to `person`. */
  kind?: AvatarKind | undefined;
}

export interface AvatarProps extends AvatarIdentity {
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
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('avatar', ['image', 'initials', 'glyph']);

function paletteSize(colorCount: number | undefined): number {
  return colorCount !== undefined && Number.isFinite(colorCount) && colorCount >= 1
    ? Math.trunc(colorCount)
    : DEFAULT_AVATAR_COLOR_COUNT;
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

/** A person's picture, or their initials on a stable colour slot; a group glyph for a group. */
export function Avatar({
  name,
  src,
  initials,
  colorKey,
  colorIndex,
  kind = 'person',
  size = 'md',
  variant = 'filled',
  colorCount,
  label,
  decorative = false,
  className,
  id,
  ...rest
}: AvatarProps) {
  const strings = useUiStrings();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const picture = src?.trim() ?? '';
  const color = resolveAvatarColor({ name, colorKey, colorIndex, kind }, colorCount);
  const showPicture = kind !== 'group' && picture !== '' && failedSrc !== picture;
  const text = initials?.trim() || getInitials(name);

  let content;
  if (kind === 'group') {
    content = <Glyph name="users" className={hooks.slotClass('glyph')} />;
  } else if (showPicture) {
    content = (
      <img {...hooks.slot('image')} src={picture} alt="" onError={() => setFailedSrc(picture)} />
    );
  } else {
    content = (
      <span {...hooks.slot('initials')} aria-hidden="true">
        {text}
      </span>
    );
  }

  return (
    <span
      {...hooks.root({ className, props: rest, data: { size, variant, kind, color } })}
      id={id}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': label?.trim() || name.trim() || strings.unnamed })}
    >
      {content}
    </span>
  );
}
