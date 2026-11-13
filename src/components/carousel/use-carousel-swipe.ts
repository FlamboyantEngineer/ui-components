'use client';

import { type MouseEvent, type PointerEvent, useRef, useState } from 'react';
import { isHTMLElement } from '../../utils/is-element.js';
import { capturePointer } from '../../utils/pointer-drag.js';

/** The distance in pixels a pointer travels before the carousel reads its direction. */
const swipeSlop = 10;

/** The distance a swipe must travel to change slides: this many pixels or a fifth of the viewport. */
const swipeDistance = 48;

interface CarouselSwipeOptions {
  isEnabled: boolean;
  /** Reading direction, which turns a leftward swipe into "next" or "previous". */
  direction: 'ltr' | 'rtl';
  /** Moves one step in reading order. */
  onStep: (delta: -1 | 1) => void;
}

interface SwipeGesture {
  pointerId: number;
  x: number;
  y: number;
  /** Read once the pointer passes the slop: across the slides, or along the page. */
  axis: 'horizontal' | 'vertical' | null;
}

/** Content a swipe never starts on: controls, editable text and anything draggable of its own. */
const ownGestureSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[draggable="true"]',
  '[role="button"]',
  '[role="slider"]',
  '[role="scrollbar"]',
  '[role="textbox"]',
  '[data-carousel-no-swipe]',
].join(',');

/**
 * Whether a press comes while another pointer's drag is under way: a pinch or a stray touch, so
 * neither is a swipe. The same pointer pressing again was released where the viewport never saw it
 * (outside, before the swipe took the capture), so its press starts afresh.
 */
function isSecondPointer(previous: SwipeGesture | null, press: PointerEvent): boolean {
  return previous !== null && previous.pointerId !== press.pointerId;
}

/** The travel that makes a swipe: the fixed distance, or a fifth of a narrower viewport. */
function findSwipeDistance(viewport: HTMLElement): number {
  return Math.min(swipeDistance, viewport.clientWidth / 5 || swipeDistance);
}

/** The step in reading order a swipe makes: toward the start of the reading direction goes back. */
function findStep(dx: number, direction: 'ltr' | 'rtl'): -1 | 1 {
  return dx > 0 === (direction === 'ltr') ? -1 : 1;
}

function startsOwnGesture(target: EventTarget | null, viewport: Element): boolean {
  const owner = isHTMLElement(target) ? target.closest(ownGestureSelector) : null;
  return owner !== null && viewport.contains(owner);
}

/**
 * Swipe navigation for a carousel's viewport: a touch, pen or mouse drag that travels mostly across
 * the slides and far enough moves one step, a leftward drag moving on in left-to-right reading.
 * Drags along the page stay the page's scroll, a second finger (a pinch) and a cancelled or lost
 * pointer abandon the drag, as does a release the viewport never saw (the pointer moving with no
 * button held, or pressing again), and a drag that starts on a control, editable text or draggable
 * content stays theirs. While dragging, the offset is measured for the stylesheet.
 */
export function useCarouselSwipe({ isEnabled, direction, onStep }: CarouselSwipeOptions) {
  const gestureRef = useRef<SwipeGesture | null>(null);
  const suppressClickRef = useRef(false);
  const [offset, setOffset] = useState<number | null>(null);
  const end = () => {
    gestureRef.current = null;
    setOffset(null);
  };
  if (!isEnabled) {
    return { isEnabled, isSwiping: false, offset: null, handlers: {} };
  }
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    suppressClickRef.current = false;
    const previous = gestureRef.current;
    if (previous !== null) end();
    if (isSecondPointer(previous, event)) return;
    if (!event.isPrimary || event.button !== 0) return;
    if (startsOwnGesture(event.target, event.currentTarget)) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      axis: null,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture?.pointerId !== event.pointerId) return;
    // A mouse or pen that moves with no button held was released where the viewport never saw it.
    if (event.pointerType !== 'touch' && event.buttons === 0) {
      end();
      return;
    }
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (gesture.axis === null) {
      if (Math.hypot(dx, dy) < swipeSlop) return;
      gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (gesture.axis === 'vertical') {
        end();
        return;
      }
      capturePointer(event);
    }
    // A horizontal drag is the carousel's, not a text selection.
    event.preventDefault();
    setOffset(dx);
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture?.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const isSwipe =
      gesture.axis === 'horizontal' && Math.abs(dx) >= findSwipeDistance(event.currentTarget);
    // A drag across the slides is no click on what it started over, whether or not it moved.
    suppressClickRef.current = gesture.axis === 'horizontal';
    end();
    if (isSwipe) onStep(findStep(dx, direction));
  };
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };
  return {
    isEnabled,
    isSwiping: offset !== null,
    offset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: end,
      // A touch's implicit capture on what it started over passes to the viewport; only the
      // viewport's own loss of the capture abandons the swipe.
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
        if (event.target === event.currentTarget && gestureRef.current?.axis === 'horizontal')
          end();
      },
      onClickCapture,
    },
  };
}
