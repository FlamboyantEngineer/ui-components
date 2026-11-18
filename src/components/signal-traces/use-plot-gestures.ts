'use client';

import { type KeyboardEvent, type PointerEvent, useEffect } from 'react';
import { isElement } from '../../utils/is-element.js';
import { useLatest } from '../../utils/use-latest.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { isZoomWheel } from '../../utils/use-wheel-steps.js';
import { toWheelPixels } from '../../utils/wheel-scroll.js';
import { panRange, type SignalTimeRange, zoomRange } from './signal-model.js';

interface PlotGestureOptions {
  /** The plot element, which owns the wheel. */
  plot: HTMLDivElement | null;
  domain: SignalTimeRange;
  range: SignalTimeRange;
  setRange: (range: SignalTimeRange) => void;
  /** The plotted width, in pixels, that the visible range spans. */
  plotWidth: number;
  /** The time under a viewport x. */
  timeAtClientX: (clientX: number) => number;
  /** A selector for elements whose presses are their own, such as the cursors. */
  ownPressSelector: string;
}

/** The share of the visible span one arrow key pans. */
const panShare = 0.1;
/** How much one zoom key narrows or widens the range. */
const zoomStep = 2;
/** Wheel travel, in pixels, that doubles or halves the range. */
const wheelPixelsPerDoubling = 200;

/** The range a plot key asks for, or `null` for a key the plot leaves alone. */
function readKeyRange(key: string, options: PlotGestureOptions): SignalTimeRange | null {
  const { domain, range } = options;
  const span = range[1] - range[0];
  const center = range[0] + span / 2;
  switch (key) {
    case 'ArrowLeft':
      return panRange(range, domain, -span * panShare);
    case 'ArrowRight':
      return panRange(range, domain, span * panShare);
    case '+':
    case '=':
      return zoomRange(range, domain, { factor: 1 / zoomStep, anchor: center });
    case '-':
    case '_':
      return zoomRange(range, domain, { factor: zoomStep, anchor: center });
    case '0':
      return domain;
    default:
      return null;
  }
}

/** The wheel over the plot: Ctrl or Meta (and a pinch) zooms at the pointer, sideways pans. */
function useWheelGestures(options: PlotGestureOptions) {
  const latest = useLatest(options);
  const { plot: element } = options;
  useEffect(() => {
    if (!element) return undefined;
    const onWheel = (event: WheelEvent) => {
      const { domain, range, setRange, plotWidth, timeAtClientX } = latest.current;
      const pixels = toWheelPixels(event, { width: plotWidth, height: element.clientHeight });
      const span = range[1] - range[0];
      if (isZoomWheel(event)) {
        event.preventDefault();
        const factor = 2 ** (pixels.y / wheelPixelsPerDoubling);
        setRange(zoomRange(range, domain, { factor, anchor: timeAtClientX(event.clientX) }));
      } else if (Math.abs(pixels.x) > Math.abs(pixels.y)) {
        event.preventDefault();
        setRange(panRange(range, domain, (pixels.x / Math.max(1, plotWidth)) * span));
      }
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [element, latest]);
}

/**
 * Pan and zoom on the plot: dragging pans, the wheel zooms or pans, and the focused plot pans with
 * the left and right arrows, zooms with plus and minus and returns to the whole window with 0.
 */
export function usePlotGestures(options: PlotGestureOptions) {
  useWheelGestures(options);
  const { domain, setRange, plotWidth, ownPressSelector } = options;
  const drag = usePointerDrag<HTMLDivElement, { x: number; range: SignalTimeRange }>({
    onStart: (event) => {
      if (isElement(event.target) && event.target.closest(ownPressSelector)) return null;
      return { x: event.clientX, range: options.range };
    },
    onMove: (event, start) => {
      const span = start.range[1] - start.range[0];
      const offset = (-(event.clientX - start.x) / Math.max(1, plotWidth)) * span;
      setRange(panRange(start.range, domain, offset));
    },
  });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const next = readKeyRange(event.key, options);
    if (!next) return;
    event.preventDefault();
    setRange(next);
  };
  return {
    onKeyDown,
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => drag.onPointerDown(event),
    onPointerMove: drag.onPointerMove,
    onPointerUp: drag.onPointerUp,
    onPointerCancel: drag.onPointerCancel,
    onLostPointerCapture: drag.onLostPointerCapture,
  };
}
