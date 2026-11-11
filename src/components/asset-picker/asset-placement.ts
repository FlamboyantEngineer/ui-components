// What an asset picker offers and what it hands back: the assets a search returns, and how the
// chosen one is placed.

import type { Key } from '../../core/props.js';

/** One asset a search returns. */
export interface AssetPickerItem {
  id: Key;
  /** The asset's name, shown under its thumbnail and naming its item. */
  name: string;
  /** The address of the thumbnail drawn in the grid. */
  thumbnailSrc: string;
  /** A description the alternative text starts from. */
  alt?: string | undefined;
  /** The asset's own size in pixels, the placed size starts from. */
  width?: number | undefined;
  height?: number | undefined;
}

/** Where the placed asset sits on its line. */
export type AssetPickerAlign = 'start' | 'center' | 'end';

/** How the chosen asset is placed, as the reader set it. */
export interface AssetPlacement {
  alt: string;
  /** The placed size in pixels; `null` where the reader cleared it and the asset has none. */
  width: number | null;
  height: number | null;
  align: AssetPickerAlign;
  /** Whether width and height keep the asset's proportions. */
  constrain: boolean;
}

/** The placement a newly chosen asset starts with. */
export function initialPlacement(item: AssetPickerItem, align: AssetPickerAlign): AssetPlacement {
  return {
    alt: item.alt ?? '',
    width: item.width ?? null,
    height: item.height ?? null,
    align,
    constrain: true,
  };
}

/**
 * A new width or height, the other side following in the asset's proportions while `constrain`
 * holds and the asset has both sides; rounded to whole pixels.
 */
export function resizePlacement(
  placement: AssetPlacement,
  item: AssetPickerItem,
  change: { side: 'width' | 'height'; value: number | null },
): AssetPlacement {
  const next = { ...placement, [change.side]: change.value };
  const { width, height } = item;
  if (!placement.constrain || change.value === null || !width || !height) return next;
  return change.side === 'width'
    ? { ...next, height: Math.round((change.value * height) / width) }
    : { ...next, width: Math.round((change.value * width) / height) };
}
