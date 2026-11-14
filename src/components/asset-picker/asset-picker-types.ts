// Assets and paged asynchronous search shared by the picker and its result grid.

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

/** One page of a search's assets; a `cursor` means another page follows. */
export interface AssetPickerPage {
  items: readonly AssetPickerItem[];
  cursor?: string | undefined;
}

/**
 * Finds the assets matching `query`, or with `cursor` the page after the one that returned it; it
 * should stop when `signal` aborts. A search without pages returns the assets alone.
 */
export type AssetPickerSearch = (
  query: string,
  signal: AbortSignal,
  cursor?: string,
) => Promise<readonly AssetPickerItem[] | AssetPickerPage>;
