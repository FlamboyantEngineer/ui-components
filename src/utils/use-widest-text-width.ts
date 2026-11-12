'use client';

import { type RefObject, useEffect, useState } from 'react';
import { listenFontsLoaded } from './listen-fonts-loaded.js';
import { useStableArray } from './use-stable-array.js';

type TextContext = OffscreenCanvasRenderingContext2D;

/** CSS `font-stretch` percentages and the keywords a canvas takes for them. */
const stretchKeywords: ReadonlyArray<readonly [number, CanvasFontStretch]> = [
  [50, 'ultra-condensed'],
  [62.5, 'extra-condensed'],
  [75, 'condensed'],
  [87.5, 'semi-condensed'],
  [100, 'normal'],
  [112.5, 'semi-expanded'],
  [125, 'expanded'],
  [150, 'extra-expanded'],
  [200, 'ultra-expanded'],
];

/** The `font-variant-caps` values a canvas takes besides `normal`. */
const variantCaps = new Set<string>([
  'small-caps',
  'all-small-caps',
  'petite-caps',
  'all-petite-caps',
  'unicase',
  'titling-caps',
]);

/** The canvas keyword nearest to a computed `font-stretch`, which browsers give as a percentage. */
function toStretchKeyword(stretch: string): CanvasFontStretch {
  const percent = Number.parseFloat(stretch);
  if (!Number.isFinite(percent)) {
    const keyword = stretchKeywords.find(([, name]) => name === stretch);
    return keyword ? keyword[1] : 'normal';
  }
  let nearest: readonly [number, CanvasFontStretch] = [100, 'normal'];
  for (const entry of stretchKeywords) {
    if (Math.abs(entry[0] - percent) < Math.abs(nearest[0] - percent)) nearest = entry;
  }
  return nearest[1];
}

/** Copies the computed text styles that change a text's width onto the canvas it supports. */
function applyTextStyle(canvas: TextContext, style: CSSStyleDeclaration) {
  canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ('letterSpacing' in canvas) canvas.letterSpacing = style.letterSpacing || 'normal';
  if ('wordSpacing' in canvas) canvas.wordSpacing = style.wordSpacing || 'normal';
  if ('fontStretch' in canvas) canvas.fontStretch = toStretchKeyword(style.fontStretch);
  if ('fontKerning' in canvas) canvas.fontKerning = toKerning(style.fontKerning);
  if ('fontVariantCaps' in canvas) canvas.fontVariantCaps = toVariantCaps(style.fontVariantCaps);
}

function toKerning(kerning: string): CanvasFontKerning {
  return kerning === 'normal' || kerning === 'none' ? kerning : 'auto';
}

function toVariantCaps(caps: string): CanvasFontVariantCaps {
  return variantCaps.has(caps) ? (caps as CanvasFontVariantCaps) : 'normal';
}

/** The text as `text-transform` draws it: upper case, lower case or each word capitalized. */
function transformText(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toLocaleUpperCase();
  if (transform === 'lowercase') return text.toLocaleLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) =>
      space.concat(letter.toLocaleUpperCase()),
    );
  }
  return text;
}

function widestText(element: Element, texts: readonly string[]): number | null {
  const canvas =
    typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d');
  const view = element.ownerDocument.defaultView;
  if (!canvas || !view) return null;
  const style = view.getComputedStyle(element);
  applyTextStyle(canvas, style);
  const transform = style.textTransform;
  return Math.ceil(
    texts.reduce(
      (widest, text) => Math.max(widest, canvas.measureText(transformText(text, transform)).width),
      0,
    ),
  );
}

/**
 * The width, in pixels, of the widest of `texts` in the font of `ref`'s element, measured on a
 * canvas once per set of texts, again when `fontKey` changes (a value that changes when the
 * element's font may have, such as a choice a stylesheet draws in its own font), again when the
 * document's fonts are ready, and again whenever fonts finish loading in the element's document
 * later on. `null` where no canvas is available.
 */
export function useWidestTextWidth(
  ref: RefObject<Element | null>,
  texts: readonly string[],
  fontKey?: unknown,
): number | null {
  const [width, setWidth] = useState<number | null>(null);
  const lines = useStableArray(texts);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let active = true;
    const measure = () => {
      if (active) setWidth(widestText(element, lines));
    };
    measure();
    void element.ownerDocument.fonts?.ready.then(measure);
    // A font that loads later, through a stylesheet or a FontFace added after mount, measures again.
    const stopListening = listenFontsLoaded(element, measure);
    return () => {
      active = false;
      stopListening();
    };
    // `fontKey` only marks when to measure again; the font itself is read from the element.
  }, [ref, lines, fontKey]);
  return width;
}
