'use client';

import { useEffect, useState, type RefObject } from 'react';
import { useStableArray } from './use-stable-array.js';

function widestText(element: Element, texts: readonly string[]): number | null {
  const canvas =
    typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d');
  const view = element.ownerDocument.defaultView;
  if (!canvas || !view) return null;
  const style = view.getComputedStyle(element);
  canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return Math.ceil(
    texts.reduce((widest, text) => Math.max(widest, canvas.measureText(text).width), 0),
  );
}

/**
 * The width, in pixels, of the widest of `texts` in the font of `ref`'s element, measured on a
 * canvas once per set of texts and again when the document's fonts finish loading. `null` where
 * no canvas is available.
 */
export function useWidestTextWidth(
  ref: RefObject<Element | null>,
  texts: readonly string[],
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
    return () => {
      active = false;
    };
  }, [ref, lines]);
  return width;
}
