import { useLayoutEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { autoUpdateOverlay } from '../../utils/overlay-auto-update.js';
import { Portal } from '../portal/portal.js';

export interface TourSpotlightProps {
  /** The element the step points at; without one the spotlight is an empty point at the centre. */
  target: Element | null;
  /** The spotlight element once rendered, which anchors the popover of a step without a target. */
  element: HTMLDivElement | null;
  /** Receives the spotlight element. */
  spotlightRef: (element: HTMLDivElement | null) => void;
}

interface SpotlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

const hooks = createHooks('tour', ['spotlight']);

function measure(target: Element | null): SpotlightBox {
  if (!target) {
    return { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };
  }
  const { top, left, width, height } = target.getBoundingClientRect();
  return { top, left, width, height };
}

/** Follows the target's box in the viewport as the page scrolls, resizes or the target changes size. */
function useSpotlightBox(target: Element | null, element: HTMLDivElement | null) {
  const [box, setBox] = useState<SpotlightBox | null>(null);
  useLayoutEffect(() => {
    if (!element) return undefined;
    return autoUpdateOverlay({
      anchor: target ?? element,
      overlay: element,
      update: () => setBox(measure(target)),
    });
  }, [target, element]);
  return box;
}

/**
 * A decorative box over the step's target, fixed to its place in the viewport, that the host
 * stylesheet draws as a spotlight (for example a ring with a wide shadow dimming the page). It
 * never takes pointer events, so the target stays reachable in a non-modal tour.
 */
export function TourSpotlight({ target, spotlightRef, element }: TourSpotlightProps) {
  const box = useSpotlightBox(target, element);
  return (
    <Portal layer="modal">
      <div
        {...hooks.slot('spotlight', { targetMissing: target === null })}
        ref={spotlightRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: box?.top ?? 0,
          left: box?.left ?? 0,
          width: box?.width ?? 0,
          height: box?.height ?? 0,
          pointerEvents: 'none',
        }}
      />
    </Portal>
  );
}
