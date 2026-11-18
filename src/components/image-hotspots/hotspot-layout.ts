// Where an image hotspots surface draws its image and its hotspots.

interface FitInput {
  /** The image's intrinsic size, in pixels. */
  width: number;
  height: number;
  /** The viewport's client box, in pixels, or `null` before it was measured. */
  viewport: { width: number; height: number } | null;
  /** In percent of the fitted size. */
  zoom: number;
}

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

/**
 * The image's drawn size: at 100% the whole image fits inside the viewport, and the zoom scales that
 * fit. Before the viewport is measured, or with an empty one, the fit is the intrinsic size.
 */
export function fitImage({ width, height, viewport, zoom }: FitInput) {
  const fits: number[] = [];
  if (viewport && width > 0 && viewport.width > 0) fits.push(viewport.width / width);
  if (viewport && height > 0 && viewport.height > 0) fits.push(viewport.height / height);
  const fit = fits.length > 0 ? Math.min(...fits) : 1;
  const scale = (fit * Math.max(zoom, 0)) / 100;
  return { width: Math.max(width, 0) * scale, height: Math.max(height, 0) * scale };
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
