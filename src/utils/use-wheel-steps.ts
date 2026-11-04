'use client';

import { type RefObject, useEffect } from 'react';
import { useLatest } from './use-latest.js';
import { toWheelPixels } from './wheel-scroll.js';

/** The vertical wheel travel, in pixels, of one step: one mouse wheel notch or less. */
const pixelsPerStep = 50;

/**
 * Whether a wheel event is a browser zoom gesture: the wheel with Ctrl or Meta held, which a
 * trackpad pinch also reports as Ctrl and the wheel.
 */
export function isZoomWheel(event: Pick<WheelEvent, 'ctrlKey' | 'metaKey'>): boolean {
  return event.ctrlKey || event.metaKey;
}

/**
 * The vertical wheel over `target` steps a value: `onStep(1)` for each notch rolled up (away from
 * the reader) and `onStep(-1)` for each notch down, a trackpad's smaller deltas adding up to a step.
 * While it steps, the wheel does not scroll the page. A zoom gesture, a mostly horizontal wheel and
 * a disabled target are left to the browser; a sideways wheel with Shift held, as some platforms
 * report a Shift-modified mouse wheel, steps. The listener runs in the capture phase, so it owns the
 * wheel over the target's own inputs too.
 */
export function useWheelSteps(
  target: RefObject<HTMLElement | null>,
  onStep: (direction: 1 | -1, event: WheelEvent) => void,
  isDisabled = false,
): void {
  const step = useLatest(onStep);
  useEffect(() => {
    const element = target.current;
    if (!element || isDisabled) return;
    let travelled = 0;
    const onWheel = (event: WheelEvent) => {
      if (isZoomWheel(event)) return;
      const pixels = toWheelPixels(event, { width: element.clientWidth, height: 400 });
      // Shift turns a mouse wheel sideways on some platforms: it still steps.
      const delta = event.shiftKey && pixels.y === 0 ? { x: 0, y: pixels.x } : pixels;
      if (Math.abs(delta.y) <= Math.abs(delta.x)) return;
      event.preventDefault();
      event.stopPropagation();
      // A change of direction starts a new step.
      if (Math.sign(travelled) !== Math.sign(delta.y)) travelled = 0;
      travelled += delta.y;
      // One step at most per event, so a fast notch is still one step.
      if (Math.abs(travelled) < pixelsPerStep && Math.abs(delta.y) < pixelsPerStep) return;
      travelled = 0;
      step.current(delta.y < 0 ? 1 : -1, event);
    };
    element.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => element.removeEventListener('wheel', onWheel, { capture: true });
  }, [target, isDisabled, step]);
}
