import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type RefCallback,
  type RefObject,
} from 'react';
import { useResizeObserver } from './use-resize-observer.js';

/** The end of a row that hidden items leave from: `end` keeps the first items, `start` the last. */
export type OverflowCollapseFrom = 'start' | 'end';

export interface OverflowItemsOptions<T> {
  /** Every item, in order. A new list (other length or other entries) is measured afresh. */
  items: readonly T[];
  /** Which end hidden items leave from. Defaults to `end`. */
  collapseFrom?: OverflowCollapseFrom | undefined;
}

export interface OverflowItems<T> {
  /**
   * The container's ref. Its element children must be the rendered `visibleItems`, one element
   * each and in order, with one indicator element at the collapsing end while `hiddenItems` is not
   * empty. The container's content box is the room the items share.
   */
  containerRef: RefCallback<HTMLElement>;
  /** The items to render in the container. */
  visibleItems: readonly T[];
  /** The items that do not fit, in order, for the indicator (a "+N" count or a "more" menu). */
  hiddenItems: readonly T[];
}

export interface OverflowCountInput {
  /** Each item's outer inline size, margins included. */
  sizes: readonly number[];
  /** The container's content-box inline size. */
  available: number;
  /** The space between neighbouring items and before the indicator. */
  gap: number;
  /** The indicator's outer inline size. */
  indicatorSize: number;
  collapseFrom?: OverflowCollapseFrom | undefined;
}

/** What the visible count was solved for; anything else is measured afresh. */
interface OverflowState<T> {
  items: readonly T[] | null;
  collapseFrom: OverflowCollapseFrom;
  generation: number;
  visibleCount: number;
}

interface MeasureCache {
  sizes: number[];
  indicatorSize: number;
  /** The container's content box at the last measurement. */
  room: { width: number; height: number };
  /** Border-box widths of the observed children, to ignore reports that change nothing. */
  observed: WeakMap<Element, number>;
  /** Consecutive corrections; a guard against a renderer whose indicator never settles. */
  corrections: number;
}

/** Sub-pixel slack, so rounding never hides an item that fits. */
const tolerance = 0.5;
const maxCorrections = 4;
const noItems: readonly never[] = Object.freeze([]);

function isSameList<T>(left: readonly T[] | null, right: readonly T[]): boolean {
  if (left === right) return true;
  if (!left || left.length !== right.length) return false;
  return left.every((item, index) => Object.is(item, right[index]));
}

function readPixels(value: string): number {
  const pixels = Number.parseFloat(value);
  return Number.isFinite(pixels) ? pixels : 0;
}

function measureOuterSize(element: Element): number {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const margins = style ? readPixels(style.marginLeft) + readPixels(style.marginRight) : 0;
  return element.getBoundingClientRect().width + margins;
}

function measureRoom(container: HTMLElement) {
  const style = container.ownerDocument.defaultView?.getComputedStyle(container);
  const inline = style ? readPixels(style.paddingLeft) + readPixels(style.paddingRight) : 0;
  const block = style ? readPixels(style.paddingTop) + readPixels(style.paddingBottom) : 0;
  return {
    width: Math.max(0, container.clientWidth - inline),
    height: Math.max(0, container.clientHeight - block),
    gap: style ? readPixels(style.columnGap) : 0,
  };
}

function isSameRoom(container: HTMLElement, known: MeasureCache['room']): boolean {
  const { width, height } = measureRoom(container);
  return Math.abs(width - known.width) <= tolerance && Math.abs(height - known.height) <= tolerance;
}

/** The items and indicator rendered in this commit, from the container's element children. */
function splitChildren(container: HTMLElement, hasIndicator: boolean, collapseFrom: string) {
  const children = Array.from(container.children);
  if (!hasIndicator) return { items: children, indicator: null };
  const indicator = (collapseFrom === 'start' ? children.shift() : children.pop()) ?? null;
  return { items: children, indicator };
}

function splitItems<T>(items: readonly T[], visibleCount: number, collapseFrom: string) {
  const hiddenCount = Math.max(0, items.length - visibleCount);
  if (hiddenCount === 0) return { visibleItems: items, hiddenItems: noItems, offset: 0 };
  return collapseFrom === 'start'
    ? {
        visibleItems: items.slice(hiddenCount),
        hiddenItems: items.slice(0, hiddenCount),
        offset: hiddenCount,
      }
    : {
        visibleItems: items.slice(0, visibleCount),
        hiddenItems: items.slice(visibleCount),
        offset: 0,
      };
}

/**
 * How many items fit in a row of `available` pixels: all of them when they fit together, otherwise
 * as many as fit from the kept end beside the indicator.
 */
export function resolveOverflowCount(input: OverflowCountInput): number {
  const { sizes, available, gap, indicatorSize } = input;
  const total = sizes.reduce((sum, size) => sum + size, 0) + gap * Math.max(0, sizes.length - 1);
  if (total <= available + tolerance) return sizes.length;
  const ordered = input.collapseFrom === 'start' ? [...sizes].reverse() : sizes;
  const room = available - indicatorSize - gap + tolerance;
  let used = 0;
  let count = 0;
  for (const size of ordered) {
    used += size + (count > 0 ? gap : 0);
    if (used > room) break;
    count += 1;
  }
  return count;
}

interface CommitMeasurement<T> {
  element: HTMLElement;
  measured: MeasureCache;
  items: readonly T[];
  rendered: { visibleItems: readonly T[]; hiddenItems: readonly T[]; offset: number };
  collapseFrom: OverflowCollapseFrom;
  isStale: boolean;
}

/** Measures what this commit rendered and returns the visible count it leads to. */
function measureCommit<T>(input: CommitMeasurement<T>): number | null {
  const { element, measured, rendered, collapseFrom } = input;
  const children = splitChildren(element, rendered.hiddenItems.length > 0, collapseFrom);
  if (children.items.length !== rendered.visibleItems.length) return null;
  if (input.isStale) measured.sizes = input.items.map(() => 0);
  for (const [index, child] of children.items.entries()) {
    measured.sizes[rendered.offset + index] = measureOuterSize(child);
    measured.observed.set(child, child.getBoundingClientRect().width);
  }
  if (children.indicator) {
    measured.indicatorSize = measureOuterSize(children.indicator);
    measured.observed.set(children.indicator, children.indicator.getBoundingClientRect().width);
  }
  const { width, height, gap } = measureRoom(element);
  measured.room = { width, height };
  return resolveOverflowCount({
    sizes: measured.sizes,
    available: width,
    gap,
    indicatorSize: measured.indicatorSize,
    collapseFrom,
  });
}

/** Asks for a new measurement when the container's box or a rendered child's size changes. */
function useOverflowObserver(
  container: RefObject<HTMLElement | null>,
  measured: RefObject<MeasureCache>,
  remeasure: () => void,
): void {
  useResizeObserver(
    () => {
      const element = container.current;
      if (!element) return [];
      const children = Array.from(element.children, (child) => ({
        element: child,
        box: 'border-box' as const,
      }));
      return [element, ...children];
    },
    (entries) => {
      const changed = entries.some(({ target }) => {
        if (target === container.current) {
          return !isSameRoom(container.current, measured.current.room);
        }
        const known = measured.current.observed.get(target);
        const size = target.getBoundingClientRect().width;
        return known === undefined || Math.abs(known - size) > tolerance;
      });
      if (changed) remeasure();
    },
  );
}

/**
 * Measures which items fit in one row of a container and which overflow, for a row that collapses
 * items into a "+N" count or a "more" menu. Hidden items are not rendered. A new item list, and any
 * change to the container's box or a rendered child's size, renders every item once to measure it;
 * the measuring commit and the solved one run back to back, before the browser paints.
 */
export function useOverflowItems<T>({
  items,
  collapseFrom = 'end',
}: OverflowItemsOptions<T>): OverflowItems<T> {
  const container = useRef<HTMLElement | null>(null);
  const containerRef = useCallback((node: HTMLElement | null) => {
    container.current = node;
  }, []);
  const cache = useRef<MeasureCache>({
    sizes: [],
    indicatorSize: 0,
    room: { width: -1, height: -1 },
    observed: new WeakMap(),
    corrections: 0,
  });
  const [generation, remeasure] = useReducer((count: number) => count + 1, 0);
  const [state, setState] = useState<OverflowState<T>>({
    items: null,
    collapseFrom,
    generation,
    visibleCount: items.length,
  });
  useOverflowObserver(container, cache, remeasure);

  const isStale =
    !isSameList(state.items, items) ||
    state.collapseFrom !== collapseFrom ||
    state.generation !== generation;
  const rendered = useMemo(() => {
    if (!isStale) return splitItems(items, state.visibleCount, collapseFrom);
    // A measuring commit renders every item, keeping the indicator it had so it stays mounted.
    const previous = splitItems(state.items ?? items, state.visibleCount, collapseFrom);
    return { visibleItems: items, hiddenItems: previous.hiddenItems, offset: 0 };
  }, [items, isStale, state, collapseFrom]);

  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measured = cache.current;
    const visibleCount = measureCommit({
      element,
      measured,
      items,
      rendered,
      collapseFrom,
      isStale,
    });
    if (visibleCount === null) return;
    const changed = visibleCount !== state.visibleCount;
    if (!isStale && (!changed || measured.corrections >= maxCorrections)) {
      measured.corrections = 0;
      return;
    }
    measured.corrections = isStale ? 0 : measured.corrections + 1;
    setState({ items, collapseFrom, generation, visibleCount });
  }, [items, rendered, collapseFrom, isStale, state.visibleCount, generation]);

  return { containerRef, visibleItems: rendered.visibleItems, hiddenItems: rendered.hiddenItems };
}
