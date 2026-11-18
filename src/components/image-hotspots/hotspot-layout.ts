// Where an image hotspots surface draws its hotspots.

/** A hotspot's rectangle in percent of the image's intrinsic width and height. */
export interface HotspotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A finite number clamped to `[min, max]`; anything else is `min`. */
function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
}

/** A rectangle kept on the image: its corner inside it, and its size up to the image's far edge. */
export function clampHotspotRect({ x, y, width, height }: HotspotRect): HotspotRect {
  const left = clamp(x, 0, 100);
  const top = clamp(y, 0, 100);
  return {
    x: left,
    y: top,
    width: clamp(width, 0, 100 - left),
    height: clamp(height, 0, 100 - top),
  };
}
