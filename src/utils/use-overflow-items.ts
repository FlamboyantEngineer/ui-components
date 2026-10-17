import {
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type RefCallback,
  type RefObject,
} from 'react';
import {
  measureContentBox,
  measureOuterSize,
  measureRoom,
  readParts,
  type OverflowCollapseFrom,
} from './overflow-measure.js';
import { useResizeObserver } from './use-resize-observer.js';

export type { OverflowCollapseFrom } from './overflow-measure.js';

export interface OverflowItemsOptions<T> {
  /** Every item, in order. A new list (other length or other entries) is measured afresh. */
  items: readonly T[];
  /** Which end hidden items leave from. Defaults to `end`. */
  collapseFrom?: OverflowCollapseFrom | undefined;
  /**
   * An item's priority. Items with a lower priority are hidden first; items of the same priority
   * leave from `collapseFrom`. Defaults to 0 for every item.
   */
  getPriority?: ((item: T, index: number) => number) | undefined;
}

export interface OverflowItems<T> {
  /**
   * The container's ref. Its element children must be the rendered `visibleItems`, one element
   * each and in order, plus one indicator while `hiddenItems` is not empty: the element given
   * `indicatorRef`, or else the child at the collapsing end. The container's content box is the
   * room the items share.
   */
  containerRef: RefCallback<HTMLElement>;
  /**
   * For items inside an element of their own (a list with its own role), a child of the container:
   * its element children are then the rendered items, the indicator is the element given
   * `indicatorRef` (or the item container's neighbour at the collapsing end), and the container's
   * other element children keep their size.
   */
  itemContainerRef: RefCallback<HTMLElement>;
  /** The indicator's ref, for an indicator the caller places anywhere among the items. */
  indicatorRef: RefCallback<HTMLElement>;
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
  order: string;
  generation: number;
  visibleCount: number;
}

interface MeasureCache {
  sizes: number[];
  indicatorSize: number;
  /** The container's content box at the last measurement. */
  room: { width: number; height: number };
  /** Border-box widths of the observed elements, to ignore reports that change nothing. */
  observed: WeakMap<Element, number>;
  /** Consecutive corrections; a guard against a renderer whose indicator never settles. */
  corrections: number;
}

interface RenderedItems<T> {
  visibleItems: readonly T[];
  hiddenItems: readonly T[];
  /** The positions in `items` of the visible items. */
  visibleIndices: readonly number[];
}

interface RenderOptions {
  collapseFrom: OverflowCollapseFrom;
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

function isSameRoom(container: HTMLElement, known: MeasureCache['room']): boolean {
  const { width, height } = measureContentBox(container);
  return Math.abs(width - known.width) <= tolerance && Math.abs(height - known.height) <= tolerance;
}

/** Item positions in the order they are kept: highest priority first, then from the kept end. */
function resolveKeepOrder(priorityKey: string, collapseFrom: OverflowCollapseFrom): number[] {
  const priorities = priorityKey === '' ? [] : priorityKey.split(',').map(Number);
  const order = priorities.map((_, index) => index);
  return order.sort(
    (left, right) =>
      (priorities[right] ?? 0) - (priorities[left] ?? 0) ||
      (collapseFrom === 'start' ? right - left : left - right),
  );
}

function splitItems<T>(
  items: readonly T[],
  visibleCount: number,
  order: readonly number[],
): RenderedItems<T> {
  const indices = items.map((_, index) => index);
  if (visibleCount >= items.length) {
    return { visibleItems: items, hiddenItems: noItems, visibleIndices: indices };
  }
  const kept = new Set(order.slice(0, visibleCount));
  const visibleIndices = indices.filter((index) => kept.has(index));
  return {
    visibleItems: visibleIndices.map((index) => items[index] as T),
    hiddenItems: indices.filter((index) => !kept.has(index)).map((index) => items[index] as T),
    visibleIndices,
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
  itemContainer: HTMLElement | null;
  indicator: HTMLElement | null;
  measured: MeasureCache;
  items: readonly T[];
  rendered: RenderedItems<T>;
  order: readonly number[];
  collapseFrom: OverflowCollapseFrom;
  isStale: boolean;
}

function recordSize(measured: MeasureCache, element: Element): number {
  measured.observed.set(element, element.getBoundingClientRect().width);
  return measureOuterSize(element);
}

/** Measures what this commit rendered and returns the visible count it leads to. */
function measureCommit<T>(input: CommitMeasurement<T>): number | null {
  const { element, itemContainer, measured, rendered, collapseFrom } = input;
  const parts = readParts(element, itemContainer, {
    hasIndicator: rendered.hiddenItems.length > 0,
    indicator: input.indicator,
    collapseFrom,
  });
  if (parts.items.length !== rendered.visibleItems.length) return null;
  if (input.isStale) measured.sizes = input.items.map(() => 0);
  for (const [index, child] of parts.items.entries()) {
    measured.sizes[rendered.visibleIndices[index] ?? index] = recordSize(measured, child);
  }
  for (const part of parts.fixed) recordSize(measured, part);
  const room = measureRoom(element, itemContainer, parts.fixed);
  if (parts.indicator) {
    measured.indicatorSize = recordSize(measured, parts.indicator) + room.indicatorGap - room.gap;
  }
  measured.room = { width: room.width, height: room.height };
  return resolveOverflowCount({
    sizes: input.order.map((index) => measured.sizes[index] ?? 0),
    available: room.available,
    gap: room.gap,
    indicatorSize: measured.indicatorSize,
  });
}

/** Asks for a new measurement when the container's box or a rendered element's size changes. */
function useOverflowObserver(
  elements: Pick<OverflowElements, 'container' | 'itemContainer'>,
  measured: RefObject<MeasureCache>,
  remeasure: () => void,
): void {
  useResizeObserver(
    () => {
      const element = elements.container.current;
      if (!element) return [];
      const nested = elements.itemContainer.current;
      const children = [...element.children, ...(nested ? nested.children : [])].map((child) => ({
        element: child,
        box: 'border-box' as const,
      }));
      return [element, ...children];
    },
    (entries) => {
      const container = elements.container.current;
      const changed = entries.some(({ target }) => {
        if (target === container) return !isSameRoom(container, measured.current.room);
        const known = measured.current.observed.get(target);
        const size = target.getBoundingClientRect().width;
        return known === undefined || Math.abs(known - size) > tolerance;
      });
      if (changed) remeasure();
    },
  );
}

interface OverflowElements {
  container: RefObject<HTMLElement | null>;
  itemContainer: RefObject<HTMLElement | null>;
  indicator: RefObject<HTMLElement | null>;
}

/** The elements the row measures, and the stable callback refs that record them. */
function useOverflowElements() {
  const elements = useRef<OverflowElements>({
    container: { current: null },
    itemContainer: { current: null },
    indicator: { current: null },
  }).current;
  const refs = useMemo(() => {
    const record = (key: keyof OverflowElements) => (node: HTMLElement | null) => {
      elements[key].current = node;
    };
    return {
      containerRef: record('container'),
      itemContainerRef: record('itemContainer'),
      indicatorRef: record('indicator'),
    };
  }, [elements]);
  return { elements, refs };
}

function createMeasureCache(): MeasureCache {
  return {
    sizes: [],
    indicatorSize: 0,
    room: { width: -1, height: -1 },
    observed: new WeakMap(),
    corrections: 0,
  };
}

/** The order items are kept in, and a key of the priorities it was resolved from. */
function useKeepOrder<T>(
  items: readonly T[],
  { getPriority, collapseFrom }: Pick<OverflowItemsOptions<T>, 'getPriority'> & RenderOptions,
) {
  const orderKey = items
    .map((item, index) => {
      const priority = getPriority?.(item, index) ?? 0;
      return Number.isFinite(priority) ? priority : 0;
    })
    .join(',');
  const order = useMemo(() => resolveKeepOrder(orderKey, collapseFrom), [orderKey, collapseFrom]);
  return { order, orderKey };
}

/**
 * Measures which items fit in one row of a container and which overflow, for a row that collapses
 * items into a "+N" count or a "more" menu. Hidden items are not rendered. A new item list, new
 * priorities, and any change to the container's box or a rendered element's size render every item
 * once to measure it; the measuring commit and the solved one run back to back, before the browser
 * paints.
 */
export function useOverflowItems<T>({
  items,
  collapseFrom = 'end',
  getPriority,
}: OverflowItemsOptions<T>): OverflowItems<T> {
  const { elements, refs } = useOverflowElements();
  const cache = useRef<MeasureCache>(createMeasureCache());
  const [generation, remeasure] = useReducer((count: number) => count + 1, 0);
  const { order, orderKey } = useKeepOrder(items, { getPriority, collapseFrom });
  const [state, setState] = useState<OverflowState<T>>({
    items: null,
    collapseFrom,
    order: orderKey,
    generation,
    visibleCount: items.length,
  });
  useOverflowObserver(elements, cache, remeasure);

  const isStale =
    !isSameList(state.items, items) ||
    state.collapseFrom !== collapseFrom ||
    state.order !== orderKey ||
    state.generation !== generation;
  const rendered = useMemo(() => {
    if (!isStale) return splitItems(items, state.visibleCount, order);
    // A measuring commit renders every item, keeping the indicator it had so it stays mounted.
    const previous = splitItems(
      state.items ?? items,
      state.visibleCount,
      resolveKeepOrder(state.order, state.collapseFrom),
    );
    return {
      visibleItems: items,
      hiddenItems: previous.hiddenItems,
      visibleIndices: items.map((_, index) => index),
    };
  }, [items, isStale, state, order]);

  useLayoutEffect(() => {
    const element = elements.container.current;
    if (!element) return;
    const measured = cache.current;
    const visibleCount = measureCommit({
      element,
      itemContainer: elements.itemContainer.current,
      indicator: elements.indicator.current,
      measured,
      items,
      rendered,
      order,
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
    setState({ items, collapseFrom, order: orderKey, generation, visibleCount });
  }, [
    elements,
    items,
    rendered,
    order,
    orderKey,
    collapseFrom,
    isStale,
    state.visibleCount,
    generation,
  ]);

  return {
    ...refs,
    visibleItems: rendered.visibleItems,
    hiddenItems: rendered.hiddenItems,
  };
}
