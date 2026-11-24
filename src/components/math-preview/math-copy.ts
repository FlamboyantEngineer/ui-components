// Copying typeset math (specs/MATH-PREVIEW.md, UIC-MATH-PREVIEW-4): as an equation other editors
// paste as math, or as a picture of its drawing. Its LaTeX source copies as plain text (`copyText`).

import {
  copyImage,
  copyRichText,
  type ImageCopyOptions,
  type RichCopyOptions,
  type RichCopyResult,
} from '../../utils/clipboard.js';
import { readPngText } from '../../utils/png-text.js';
import { drawSvgImage, type SvgImageOptions, svgImageSize } from '../../utils/svg-image.js';

const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const TEX_ENCODING = 'application/x-tex';

export interface MathCopyOptions extends RichCopyOptions {
  /** The LaTeX source, kept as the equation's TeX annotation when its MathML carries none. */
  source?: string | undefined;
}

const isTexAnnotation = (element: Element) =>
  element.localName === 'annotation' && element.getAttribute('encoding') === TEX_ENCODING;

/**
 * The `<math>` element as standalone MathML markup: in the MathML namespace, with `source` as its
 * TeX annotation when it carries none, so an editor that reads LaTeX gets the source back.
 */
export function mathMarkup(math: Element, source?: string): string {
  const document = math.ownerDocument;
  const copy = document.createElementNS(MATHML_NAMESPACE, 'math');
  for (const attribute of Array.from(math.attributes))
    if (attribute.name !== 'xmlns') copy.setAttribute(attribute.name, attribute.value);
  const children = Array.from(math.childNodes, (node) => node.cloneNode(true));
  const annotated = Array.from(math.getElementsByTagName('annotation')).some(isTexAnnotation);
  if (source && !annotated) {
    const semantics = document.createElementNS(MATHML_NAMESPACE, 'semantics');
    const row = document.createElementNS(MATHML_NAMESPACE, 'mrow');
    const annotation = document.createElementNS(MATHML_NAMESPACE, 'annotation');
    row.append(...children);
    annotation.setAttribute('encoding', TEX_ENCODING);
    annotation.textContent = source;
    semantics.append(row, annotation);
    copy.append(semantics);
  } else copy.append(...children);
  return new XMLSerializer().serializeToString(copy);
}

/**
 * Copies typeset math as an equation: its MathML markup (`mathMarkup`) as both the HTML and the
 * plain text, so word processors that read MathML from either paste an equation.
 */
export function copyMath(math: Element, options: MathCopyOptions = {}): Promise<RichCopyResult> {
  const { source, ...copy } = options;
  const markup = mathMarkup(math, source);
  return copyRichText({ text: markup, html: markup }, copy);
}

export interface MathImageCopyOptions
  extends Omit<ImageCopyOptions, 'size' | 'attributes'>, Omit<SvgImageOptions, 'text'> {
  /** The LaTeX source, carried in the image so it can become math again (`readMathImage`). */
  source?: string | undefined;
  /** Whether the math is display math. Defaults to false. */
  display?: boolean | undefined;
}

/** The PNG text keyword that holds the LaTeX source of a copied math image. */
const MATH_IMAGE_SOURCE_KEY = 'LaTeX';
/** The PNG text keyword that holds `display` for display math. */
const MATH_IMAGE_DISPLAY_KEY = 'LaTeX display';

/**
 * Copies math's SVG drawing as a PNG (`drawSvgImage`), with an HTML image showing it at the
 * drawing's size; its ink is black on a transparent ground unless `color` or `background` say
 * otherwise, so it reads on a white page whatever the reader's theme. With `source`, the PNG
 * carries the LaTeX as text chunks and the HTML image as `data-latex` (with `data-math-display`
 * for display math), so an editor that reads either can paste the math back as math.
 */
export function copyMathImage(
  drawing: SVGSVGElement,
  options: MathImageCopyOptions = {},
): Promise<boolean> {
  const { width, height, scale, color = '#000000', background, source, display, ...copy } = options;
  const size = svgImageSize(drawing, { width, height });
  const text = source
    ? {
        [MATH_IMAGE_SOURCE_KEY]: source,
        ...(display ? { [MATH_IMAGE_DISPLAY_KEY]: 'display' } : {}),
      }
    : undefined;
  const attributes = source
    ? { 'data-latex': source, ...(display ? { 'data-math-display': 'display' } : {}) }
    : undefined;
  const image = drawSvgImage(drawing, { ...size, scale, color, background, text });
  return copyImage(image, { owner: drawing, size, alt: source, attributes, ...copy });
}

/** The math a copied math image carries (`copyMathImage` with `source`), or `null`. */
export async function readMathImage(
  image: Blob,
): Promise<{ source: string; display: boolean } | null> {
  if (image.type !== 'image/png') return null;
  const text = await readPngText(image).catch(() => ({}) as Record<string, string>);
  const source = text[MATH_IMAGE_SOURCE_KEY]?.trim();
  return source ? { source, display: text[MATH_IMAGE_DISPLAY_KEY] === 'display' } : null;
}
