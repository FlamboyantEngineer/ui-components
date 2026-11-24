// Draws an SVG element as a PNG image: the element is serialized on its own, decoded as an image
// and painted on a canvas at a pixel density above the screen's, so it stays sharp when pasted.

import { getOwnerDocument } from './owner-window.js';
import { withPngText } from './png-text.js';

export interface SvgImageOptions {
  /** The image's width in CSS pixels. Defaults to the element's drawn width, else its `width`. */
  width?: number | undefined;
  /** The image's height in CSS pixels. Defaults to the element's drawn height, else its `height`. */
  height?: number | undefined;
  /** Image pixels per CSS pixel. Defaults to 2. */
  scale?: number | undefined;
  /**
   * The color `currentColor` paints, such as the ink of math or icons. Defaults to the element's
   * own computed color.
   */
  color?: string | undefined;
  /** A color painted under the drawing. Defaults to none: the image is transparent. */
  background?: string | undefined;
  /** Text the PNG carries, by keyword, such as the source the drawing was made from. */
  text?: Record<string, string> | undefined;
}

/** The size `drawSvgImage` draws at: `width` and `height`, else the drawn size, else the attributes. */
export function svgImageSize(
  svg: SVGSVGElement,
  options: Pick<SvgImageOptions, 'width' | 'height'>,
) {
  const box = svg.getBoundingClientRect();
  const attribute = (name: string) => Number.parseFloat(svg.getAttribute(name) ?? '') || 0;
  return {
    width: options.width ?? (box.width || attribute('width')),
    height: options.height ?? (box.height || attribute('height')),
  };
}

function decode(image: HTMLImageElement, source: string): Promise<boolean> {
  return new Promise((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = source;
  });
}

/**
 * The SVG element drawn as a PNG, at its drawn size (or `width` and `height`) times `scale`, with
 * `currentColor` painted in `color`, carrying `text` as PNG text chunks. Rejects when the element has no size or the browser cannot
 * decode or encode it. Only the element is drawn: page styles do not reach it, so its paint must
 * be its own attributes, as a typeset or icon drawing's is.
 */
export async function drawSvgImage(
  svg: SVGSVGElement,
  options: SvgImageOptions = {},
): Promise<Blob> {
  const document = getOwnerDocument(svg);
  const { width, height } = svgImageSize(svg, options);
  const scale = options.scale ?? 2;
  if (!(width > 0 && height > 0)) throw new Error('The drawing has no size.');
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('width', String(width));
  copy.setAttribute('height', String(height));
  const color = options.color ?? document.defaultView?.getComputedStyle(svg).color ?? '';
  copy.setAttribute('style', color ? `color: ${color}` : '');
  const markup = new XMLSerializer().serializeToString(copy);
  const image = document.createElement('img');
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  if (!(await decode(image, source))) throw new Error('The drawing could not be decoded.');
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The drawing could not be painted.');
  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  canvas.width = 0;
  canvas.height = 0;
  if (!png) throw new Error('The drawing could not be encoded.');
  return options.text ? withPngText(png, options.text) : png;
}
