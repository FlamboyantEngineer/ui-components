import { getColorIndex } from '../../utils/color-index.js';
import type { AvatarIdentity } from './avatar.js';

/** The number of colour slots a derived colour is spread over unless `colorCount` says otherwise. */
export const DEFAULT_AVATAR_COLOR_COUNT = 8;

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
