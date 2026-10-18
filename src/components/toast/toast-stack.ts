// Stacking: each toast measures itself, so it knows its place in the stack and the height of the
// newer toasts in front of it; regions and lists also hand their swipe settings down.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FocusEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { UNSTABLE_ToastStateContext as ToastStateContext } from '../../primitives/index.js';
import { useElementSize } from '../../utils/use-element-size.js';
import type { ToastSwipeDirection } from './use-toast-swipe.js';

export interface ToastStackSettings {
  /** The direction a toast is swiped to dismiss it. Defaults to `right`. */
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
}

/** A toast's place in its stack. */
export interface ToastStackPosition {
  /** 0 for the newest visible toast. */
  index: number;
  /** The summed height of the newer visible toasts, in pixels. */
  offset: number;
  swipeDirection: ToastSwipeDirection;
  swipeThreshold: number;
}

const defaultSwipeThreshold = 50;

const ToastStackContext = createContext<ToastStackValue>({
  swipeDirection: 'right',
  swipeThreshold: defaultSwipeThreshold,
  heights: new Map(),
  report: () => {},
});

export const ToastStackProvider = ToastStackContext.Provider;

/** The stack a region or list provides: its swipe settings and its toasts' measured heights. */
export function useToastStack({
  swipeDirection = 'right',
  swipeThreshold = defaultSwipeThreshold,
}: ToastStackSettings): ToastStackValue {
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
    () => ({ swipeDirection, swipeThreshold, heights, report }),
    [swipeDirection, swipeThreshold, heights, report],
  );
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

/**
 * Whether the pointer is over the region or focus is inside its list: the stack is expanded. React
 * Aria's region forwards pointer handlers but not focus ones, so those go on the list.
 */
export function useStackExpanded() {
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const pointerHandlers = {
    onPointerEnter: (event: PointerEvent) => setHovered(event.pointerType !== 'touch'),
    onPointerLeave: () => setHovered(false),
  };
  const focusHandlers = {
    onFocus: () => setFocused(true),
    onBlur: (event: FocusEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    },
  };
  return { isExpanded: isHovered || isFocused, pointerHandlers, focusHandlers };
}
