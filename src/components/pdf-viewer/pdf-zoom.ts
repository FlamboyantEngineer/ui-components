import { findMaximum } from '../../utils/find-maximum.js';
import { clamp } from '../../utils/clamp.js';

/** A zoom in percent, or a fit mode resolved against the space the pages have. */
export type PdfZoom = number | 'page-width' | 'page-fit';

export interface PdfSize {
  width: number;
  height: number;
}

export interface ResolveZoomOptions {
  zoom: PdfZoom;
  /** The page to fit, in points. */
  page: PdfSize | null;
  /** The space the page column has, in CSS pixels. */
  available: PdfSize | null;
}

/** The zoom ladder in percent: a 25% grid from 25% to 1000%. */
export const pdfZoomLevels: readonly number[] = Array.from({ length: 40 }, (_, i) => (i + 1) * 25);

// CSS pixels per PDF point at 100%, where a page shows at its printed size.
const cssPixelsPerPoint = 96 / 72;
const minZoom = 25;
const maxZoom = 1000;
// Fitting the width keeps text readable: a narrow pane does not shrink it to a quarter of its size
// and a wide one does not blow it up; past these bounds the page scrolls sideways or sits centred.
const minFitWidth = 50;
const maxFitWidth = 200;

/** The zoom in percent that a requested zoom resolves to. */
export function resolveZoomPercent({ zoom, page, available }: ResolveZoomOptions): number {
  if (typeof zoom === 'number') return clamp(zoom, minZoom, maxZoom);
  if (!page || !available || page.width <= 0 || page.height <= 0) return 100;
  const width = (available.width / (page.width * cssPixelsPerPoint)) * 100;
  if (zoom === 'page-width') return clamp(width, minFitWidth, maxFitWidth);
  const height = (available.height / (page.height * cssPixelsPerPoint)) * 100;
  return clamp(Math.min(width, height), minZoom, maxZoom);
}

/** CSS pixels per point at a zoom in percent. */
export function toCssScale(percent: number): number {
  return (percent / 100) * cssPixelsPerPoint;
}

/** The widest and tallest page dimensions, so a fit holds for every page. */
export function findLargestPage(sizes: readonly PdfSize[]): PdfSize | null {
  if (sizes.length === 0) return null;
  return {
    width: findMaximum(sizes, (size) => size.width),
    height: findMaximum(sizes, (size) => size.height),
  };
}
