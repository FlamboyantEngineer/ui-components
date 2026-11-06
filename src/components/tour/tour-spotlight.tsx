'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { listAnimations } from '../../utils/list-animations.js';
import { autoUpdateOverlay } from '../../utils/overlay-auto-update.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { Portal } from '../portal/portal.js';
import { tourHooks as hooks } from './tour-hooks.js';

interface TourSpotlightProps {
  /** The element the step points at; without one the spotlight is an empty point at the centre. */
  target: Element | null;
  /** While the step gets its target ready: the spotlight waits at the centre. */
  isPending: boolean;
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

interface SpotlightMeasurement extends SpotlightBox {
  hasTarget: boolean;
}

/** The target's box, or a point at the centre of the spotlight's window without a target. */
function measure(target: Element | null, spotlight: Element): SpotlightBox {
  if (!target) {
    const view = getOwnerWindow(spotlight);
    return { top: view.innerHeight / 2, left: view.innerWidth / 2, width: 0, height: 0 };
  }
  const { top, left, width, height } = target.getBoundingClientRect();
  return { top, left, width, height };
}

/** Follows the target's box in the viewport as the page scrolls, resizes or the target changes size. */
function useSpotlightBox(target: Element | null, element: HTMLDivElement | null) {
  const [box, setBox] = useState<SpotlightMeasurement | null>(null);
  const previous = useRef<{ element: HTMLDivElement; hasTarget: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!element) return undefined;
    return autoUpdateOverlay({
      anchor: target ?? element,
      overlay: element,
      update: () => setBox({ ...measure(target, element), hasTarget: target !== null }),
    });
  }, [target, element]);
  useLayoutEffect(() => {
    if (!element || !box) return;
    if (!box.hasTarget || !previous.current?.hasTarget || previous.current.element !== element) {
      // Read transitions after applying the box, then settle geometry before the first paint.
      // Opacity and other host animations remain independent of the highlight's position.
      for (const animation of listAnimations(element)) {
        if (
          'transitionProperty' in animation &&
          ['top', 'left', 'width', 'height'].includes(String(animation.transitionProperty))
        ) {
          animation.cancel();
        }
      }
    }
    previous.current = { element, hasTarget: box.hasTarget };
  }, [box, element]);
  return box;
}

/**
 * A decorative box over the step's target, fixed to its place in the viewport, that the host
 * stylesheet draws as a spotlight (for example a ring with a wide shadow dimming the page). It
 * never takes pointer events, so the target stays reachable in a non-modal tour.
 */
export function TourSpotlight({ target, isPending, spotlightRef, element }: TourSpotlightProps) {
  const box = useSpotlightBox(target, element);
  return (
    <Portal layer="modal">
      <div
        {...hooks.slot('spotlight', {
          targetMissing: target === null && !isPending,
          pending: isPending,
        })}
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
