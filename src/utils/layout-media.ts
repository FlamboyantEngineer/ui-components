// Where a zoomable image is drawn: fitted to its stage, zoomed and turned by quarter turns.

export interface MediaSize {
  width: number;
  height: number;
}

interface MediaLayoutInput {
  /** The image's own size, in pixels. */
  natural: MediaSize;
  /** The space the stage offers, in pixels. */
  stage: MediaSize;
  /** In percent of the fitted size. */
  zoom: number;
  /** Clockwise, in degrees: a multiple of 90. */
  rotation: number;
}

interface MediaLayout {
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
