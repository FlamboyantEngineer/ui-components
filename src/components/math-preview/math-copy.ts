// Copying typeset math (specs/MATH-PREVIEW.md, UIC-MATH-PREVIEW-4): as an equation other editors
// paste as math, or as a picture of its drawing. Its LaTeX source copies as plain text (`copyText`).

import {
  copyImage,
  copyRichText,
  type ImageCopyOptions,
  type RichCopyOptions,
  type RichCopyResult,
} from '../../utils/clipboard.js';
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

export interface MathImageCopyOptions extends Omit<ImageCopyOptions, 'size'>, SvgImageOptions {}

/**
 * Copies math's SVG drawing as a PNG (`drawSvgImage`), with an HTML image showing it at the
 * drawing's size; its ink is black on a transparent ground unless `color` or `background` say
 * otherwise, so it reads on a white page whatever the reader's theme.
 */
export function copyMathImage(
  drawing: SVGSVGElement,
  options: MathImageCopyOptions = {},
): Promise<boolean> {
  const { width, height, scale, color = '#000000', background, ...copy } = options;
  const size = svgImageSize(drawing, { width, height });
  const image = drawSvgImage(drawing, { ...size, scale, color, background });
  return copyImage(image, { owner: drawing, size, ...copy });
}
