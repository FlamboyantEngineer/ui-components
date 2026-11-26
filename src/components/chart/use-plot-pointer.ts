'use client';

import { useEffect, useRef, useState } from 'react';
import { clamp } from '../../utils/clamp.js';
import { useLatest } from '../../utils/use-latest.js';
import type { NumericViewport } from './chart-viewport.js';

export function plotFraction(element: HTMLElement, clientX: number, view: NumericViewport) {
  const [left, right] = view.axis.range;
  const offset = clientX - element.getBoundingClientRect().left - left;
  return clamp(offset / Math.max(1, right - left), 0, 1);
}

type ZoomHint = 'select' | 'zoom-in' | 'zoom-out';

/** Follow modifier changes over the plot even when keyboard focus is elsewhere. */
export function usePlotPointer(view: NumericViewport) {
  const rootRef = useRef<HTMLDivElement>(null);
  const latest = useLatest(view);
  const [hint, setHint] = useState<ZoomHint>();
  useEffect(() => {
    const element = rootRef.current;
    const owner = element?.ownerDocument.defaultView;
    if (!element || !owner) return;
    const update = (event: MouseEvent | KeyboardEvent) => {
      if (event.shiftKey) setHint('select');
      else if (event.ctrlKey) setHint((old) => (old === 'zoom-out' ? old : 'zoom-in'));
      else setHint(undefined);
    };
    const clear = () => setHint(undefined);
    const enter = (event: PointerEvent) => {
      update(event);
      owner.addEventListener('keydown', update, true);
      owner.addEventListener('keyup', update, true);
      owner.addEventListener('blur', clear);
    };
    const unwatch = () => {
      owner.removeEventListener('keydown', update, true);
      owner.removeEventListener('keyup', update, true);
      owner.removeEventListener('blur', clear);
    };
    const leave = () => {
      unwatch();
      clear();
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const zoomIn = event.deltaY < 0;
      // A trackpad pinch may synthesize Ctrl+wheel without a physical Control key.
      setHint((old) =>
        old === 'zoom-in' || old === 'zoom-out' ? (zoomIn ? 'zoom-in' : 'zoom-out') : old,
      );
      latest.current.zoom(
        zoomIn ? 0.8 : 1.25,
        plotFraction(element, event.clientX, latest.current),
      );
    };
    element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('pointerenter', enter);
    element.addEventListener('pointerleave', leave);
    return () => {
      element.removeEventListener('wheel', wheel);
      element.removeEventListener('pointerenter', enter);
      element.removeEventListener('pointerleave', leave);
      unwatch();
    };
  }, [latest]);
  return { rootRef, hint };
}
