// Where a media viewer draws an image: fitted to the stage, zoomed and turned by quarter turns.

import { isKeyOwner } from '../../utils/is-key-owner.js';

export interface MediaSize {
  width: number;
  height: number;
}

export interface MediaLayoutInput {
  /** The image's own size, in pixels. */
  natural: MediaSize;
  /** The space the stage offers, in pixels. */
  stage: MediaSize;
  /** In percent of the fitted size. */
  zoom: number;
  /** Clockwise, in degrees: a multiple of 90. */
  rotation: number;
}

export interface MediaLayout {
  /** The image element's size before it turns. */
  image: MediaSize;
  /** The box the turned image fills, which the stage scrolls when it is larger. */
  canvas: MediaSize;
}

/** Whether a turn lays the image on its side. */
function isSideways(rotation: number): boolean {
  return Math.abs(rotation) % 180 === 90;
}

/**
 * The image and canvas sizes: at 100% the turned image fits inside the stage, never larger than
 * its own size; the zoom scales that fit.
 */
export function layoutMedia({ natural, stage, zoom, rotation }: MediaLayoutInput): MediaLayout {
  const sideways = isSideways(rotation);
  const turned = sideways ? { width: natural.height, height: natural.width } : natural;
  const fits = [1];
  if (turned.width > 0 && stage.width > 0) fits.push(stage.width / turned.width);
  if (turned.height > 0 && stage.height > 0) fits.push(stage.height / turned.height);
  const scale = (Math.min(...fits) * zoom) / 100;
  return {
    image: { width: natural.width * scale, height: natural.height * scale },
    canvas: { width: turned.width * scale, height: turned.height * scale },
  };
}

/** What a key press asks of a media viewer, if anything. */
export type MediaKeyCommand = 'previous' | 'next' | 'zoom-in' | 'zoom-out';

/** Keys that ask the same of a media viewer in either text direction. */
const fixedKeys: Readonly<Record<string, MediaKeyCommand>> = {
  PageUp: 'previous',
  PageDown: 'next',
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
};

/**
 * The command of a key press: Page Up and Page Down move to the previous or next item, and so do the
 * arrow keys (mirrored right to left) unless `isPanning`, when they scroll a zoomed image instead;
 * `+` and `-` zoom. Presses with a modifier, or inside an element that uses keys itself, ask nothing.
 */
export function resolveMediaKey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>,
  direction: 'ltr' | 'rtl',
  isPanning = false,
): MediaKeyCommand | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isKeyOwner(event.target)) return null;
  const fixed = fixedKeys[event.key];
  if (fixed) return fixed;
  if (isPanning) return null;
  const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  if (event.key === forward) return 'next';
  return event.key === backward ? 'previous' : null;
}
