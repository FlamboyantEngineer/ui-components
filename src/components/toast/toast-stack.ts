'use client';

// Stacking: each toast measures itself, so it knows its place in the stack and the height of the
// newer toasts in front of it; regions and lists also hand their swipe settings down.

import {
  createContext,
  type HTMLAttributes,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  UNSTABLE_ToastStateContext as ToastStateContext,
  useFocusWithin,
  useHover,
} from '../../primitives/index.js';
import { mergeProps } from '../../utils/merge-props.js';
import { useElementSize } from '../../utils/use-element-size.js';
import type { ToastSwipeDirection } from './use-toast-swipe.js';

export interface ToastStackSettings {
  /** The direction a toast is swiped to dismiss it. Defaults to `end`, the reading direction's end. */
  swipeDirection?: ToastSwipeDirection | undefined;
  /** Pixels a swipe must travel to dismiss a toast. Defaults to 50. */
  swipeThreshold?: number | undefined;
}

interface ToastStackValue {
  swipeDirection: ToastSwipeDirection;
  swipeThreshold: number;
  /** Measured toast heights by key. */
  heights: ReadonlyMap<string, number>;
  report: (key: string, height: number | undefined) => void;
  /** The region is hovered or holds focus, so its toasts' timers stay paused. */
  isPaused: boolean;
}

/** A toast's place in its stack. */
interface ToastStackPosition {
  /** 0 for the newest visible toast. */
  index: number;
  /** The summed height of the newer visible toasts, in pixels. */
  offset: number;
  swipeDirection: ToastSwipeDirection;
  swipeThreshold: number;
}

const defaultSwipeThreshold = 50;

const ToastStackContext = createContext<ToastStackValue>({
  swipeDirection: 'end',
  swipeThreshold: defaultSwipeThreshold,
  heights: new Map(),
  report: () => {},
  isPaused: false,
});

export const ToastStackProvider = ToastStackContext;

/**
 * The stack a region or list provides: its swipe settings, its toasts' measured heights and whether
 * their timers are paused.
 */
export function useToastStack(
  { swipeDirection = 'end', swipeThreshold = defaultSwipeThreshold }: ToastStackSettings,
  isPaused = false,
): ToastStackValue {
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(() => new Map());
  const report = useCallback((key: string, height: number | undefined) => {
    setHeights((current) => {
      if (current.get(key) === height) return current;
      const next = new Map(current);
      if (height === undefined) next.delete(key);
      else next.set(key, height);
      return next;
    });
  }, []);
  return useMemo(
    () => ({ swipeDirection, swipeThreshold, heights, report, isPaused }),
    [swipeDirection, swipeThreshold, heights, report, isPaused],
  );
}

/** Whether the toast's stack holds its timers: its region is hovered or holds focus. */
export function useIsStackPaused(): boolean {
  return useContext(ToastStackContext).isPaused;
}

/** Measures the toast in `ref` into its stack and returns its index and offset there. */
export function useToastStackPosition(
  key: string,
  ref: RefObject<HTMLElement | null>,
): ToastStackPosition {
  const { heights, report, swipeDirection, swipeThreshold } = useContext(ToastStackContext);
  const toasts = useContext(ToastStateContext)?.visibleToasts ?? [];
  const height = useElementSize(ref, { box: 'border-box' })?.height;
  useEffect(() => report(key, height), [report, key, height]);
  useEffect(() => () => report(key, undefined), [report, key]);
  const index = Math.max(
    0,
    toasts.findIndex((toast) => toast.key === key),
  );
  const offset = toasts
    .slice(0, index)
    .reduce((sum, toast) => sum + (heights.get(toast.key) ?? 0), 0);
  return { index, offset, swipeDirection, swipeThreshold };
}

/** Whether a point lies in the box around the region and its toasts, where they are drawn now. */
function isOverStack(region: Element, x: number, y: number): boolean {
  const boxes = [region, ...region.querySelectorAll('[role="alertdialog"]')]
    .map((element) => element.getBoundingClientRect())
    .filter((box) => box.width > 0 && box.height > 0);
  if (boxes.length === 0) return false;
  const left = Math.min(...boxes.map((box) => box.left));
  const right = Math.max(...boxes.map((box) => box.right));
  const top = Math.min(...boxes.map((box) => box.top));
  const bottom = Math.max(...boxes.map((box) => box.bottom));
  return x >= left && x <= right && y >= top && y <= bottom;
}

/**
 * Whether the pointer that left the hovered region is still within the box around its toasts: an
 * expanded stack spreads its toasts beyond the region with gaps between them, and crossing a gap
 * toward an older toast keeps the stack hovered. The pointer is followed from the moment it hovers
 * the region until it moves out of that box or leaves the page, so the move that ends the hover is
 * already counted. The box takes no pointer events, so nothing under it is covered.
 */
function useStackPointer(
  region: RefObject<HTMLElement | null>,
  { hasToasts, isHovered }: { hasToasts: boolean; isHovered: boolean },
): { isOver: boolean; onHoverEnd: () => void } {
  const [isOver, setOver] = useState(false);
  // Where the last move went, before or after the hover ended; a hover starts over the region.
  const isLastOver = useRef(true);
  if (!hasToasts && isOver) setOver(false);
  const isTracking = hasToasts && (isHovered || isOver);
  useEffect(() => {
    const element = region.current;
    if (!isTracking || !element) return undefined;
    const document = element.ownerDocument;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const isPointOver = isOverStack(element, event.clientX, event.clientY);
      isLastOver.current = isPointOver;
      setOver((current) => current && isPointOver);
    };
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) setOver(false);
    };
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerout', onOut, true);
    return () => {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerout', onOut, true);
    };
  }, [region, isTracking]);
  useEffect(() => {
    if (isHovered) isLastOver.current = true;
  }, [isHovered]);
  return {
    isOver: hasToasts && isOver,
    onHoverEnd: () => setOver(hasToasts && isLastOver.current),
  };
}

/**
 * Whether the pointer is over the region or focus is inside it, on the region itself included: the
 * stack is expanded and its timers pause. The pointer counts as over the region anywhere in the box
 * around its spread toasts, gaps included (`useStackPointer`). React Aria's hover and focus-within
 * also end when a toast under the pointer or holding focus leaves and the pointer or focus moves on;
 * a region left without toasts has neither. `regionProps` go on the region element.
 */
export function useStackExpanded(hasToasts: boolean): {
  isExpanded: boolean;
  regionProps: HTMLAttributes<HTMLElement> & { ref: RefObject<HTMLElement | null> };
} {
  const ref = useRef<HTMLElement>(null);
  const [isFocused, setFocused] = useState(false);
  const [isHovered, setHovered] = useState(false);
  const pointer = useStackPointer(ref, { hasToasts, isHovered: hasToasts && isHovered });
  const { hoverProps } = useHover({
    isDisabled: !hasToasts,
    onHoverChange: setHovered,
    onHoverEnd: pointer.onHoverEnd,
  });
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setFocused });
  if (!hasToasts && isFocused) setFocused(false);
  return {
    isExpanded: (hasToasts && isHovered) || pointer.isOver || isFocused,
    regionProps: { ...mergeProps(hoverProps, focusWithinProps), ref },
  };
}
