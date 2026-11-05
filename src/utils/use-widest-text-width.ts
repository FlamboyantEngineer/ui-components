'use client';

import { type RefObject, useEffect, useState } from 'react';
import { listenFontsLoaded } from './listen-fonts-loaded.js';
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
 * canvas once per set of texts, again when the document's fonts are ready, and again whenever
 * fonts finish loading in the element's document later on. `null` where no canvas is available.
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
    // A font that loads later, through a stylesheet or a FontFace added after mount, measures again.
    const stopListening = listenFontsLoaded(element, measure);
    return () => {
      active = false;
      stopListening();
    };
  }, [ref, lines]);
  return width;
}
