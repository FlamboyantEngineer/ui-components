import { measureScale } from '../../utils/element-scale.js';
import { readOffset } from './transcript-geometry.js';
import { createTranscriptHeights, type TranscriptOrder } from './transcript-heights.js';

/** The run of children near the viewport, by their first and last keys. */
export interface WindowRange {
  first: string;
  last: string;
}

/** Heights of the children a virtualized transcript has measured, and the window they give. */
export interface WindowModel {
  /** Records the gap spacers it renders, so measuring skips them. */
  spacerRef(element: HTMLElement | null): void;
  /** Whether an element is one of those gap spacers. */
  isSpacer(element: Element): boolean;
  /** Measures the mounted children, given their keys in order. */
  measure(viewport: HTMLElement, feed: HTMLElement, mounted: readonly string[]): void;
  /** The children within one viewport height of the visible area. */
  range(viewport: HTMLElement, feed: HTMLElement, order: TranscriptOrder): WindowRange | null;
  /**
   * The height that stands in for the unmounted children from `start` up to `end`, in whole pixels,
   * so the scroll position, which browsers keep in whole pixels, can follow a change exactly.
   */
  gapHeight(order: TranscriptOrder, start: number, end: number): number;
  /** Forgets every measurement, for another conversation. */
  reset(): void;
}

/** How many children the window holds before the viewport can be measured. */
const initialWindow = 30;

interface WindowEdges {
  first: number;
  last: number;
  outerFirst: number;
  outerLast: number;
}

/** The last `initialWindow` children, where a transcript starts. */
export function resolveTailRange(keys: readonly string[]): WindowRange | null {
  const last = keys.at(-1);
  const first = keys[Math.max(0, keys.length - initialWindow)];
  return first === undefined || last === undefined ? null : { first, last };
}

/** A wider retention band prevents measured boundary rows repeatedly entering and leaving. */
function retainWindowRange(
  { keys, indexOf }: TranscriptOrder,
  previous: WindowRange | null,
  { first, last, outerFirst, outerLast }: WindowEdges,
): WindowRange {
  const oldFirst = previous === null ? undefined : indexOf.get(previous.first);
  const oldLast = previous === null ? undefined : indexOf.get(previous.last);
  if (oldFirst === undefined || oldLast === undefined) {
    return { first: keys[first] as string, last: keys[last] as string };
  }
  return {
    first: keys[Math.min(first, Math.max(oldFirst, outerFirst))] as string,
    last: keys[Math.max(last, Math.min(oldLast, outerLast))] as string,
  };
}

/** Creates the model; children it has not measured count as the measured average. */
export function createWindowModel(): WindowModel {
  const heights = createTranscriptHeights();
  const spacers = new WeakSet<Element>();
  let gap = 0;
  let previousRange: WindowRange | null = null;

  return {
    spacerRef(element) {
      if (element) spacers.add(element);
    },
    isSpacer: (element) => spacers.has(element),
    reset() {
      heights.reset();
      gap = 0;
      previousRange = null;
    },
    measure(viewport, feed, mounted) {
      const elements = [...feed.children].filter((child) => !spacers.has(child));
      // A child that drew no element, or several, would pair heights with the wrong keys.
      if (elements.length !== mounted.length) return;
      // Spacer heights and scroll offsets use layout pixels, even inside a scaled ancestor.
      const { y: scale } = measureScale(viewport);
      if (scale <= 0) return;
      const style = feed.ownerDocument.defaultView?.getComputedStyle(feed);
      gap = Number.parseFloat(style?.rowGap ?? '') || 0;
      elements.forEach((element, index) => {
        heights.set(mounted[index] as string, element.getBoundingClientRect().height / scale);
      });
    },
    range(viewport, feed, order) {
      const { keys } = order;
      // A viewport the stylesheet left unbounded is seen through the window at most.
      const view = Math.min(
        viewport.clientHeight,
        feed.ownerDocument.defaultView?.innerHeight ?? 0,
      );
      if (view <= 0) return resolveTailRange(keys);
      const feedTop = readOffset(feed, viewport);
      const top = -feedTop - view;
      const bottom = -feedTop + 2 * view;
      const { findPrefix } = heights.inOrder(order);
      // A first row's bottom is the end of its prefix, before the gap to the next row.
      const findFirst = (edge: number) =>
        findPrefix((end, height) => height + (end - 1) * gap <= edge);
      const findLast = (edge: number) => {
        if (edge <= 0) return -1;
        const end = findPrefix((count, height) => height + count * gap < edge);
        return Math.min(keys.length - 1, end);
      };
      const first = findFirst(top);
      const last = findLast(bottom);
      if (first >= keys.length || last < 0) return resolveTailRange(keys);
      previousRange = retainWindowRange(order, previousRange, {
        first,
        last,
        outerFirst: findFirst(top - view / 2),
        outerLast: findLast(bottom + view / 2),
      });
      return previousRange;
    },
    gapHeight(order, start, end) {
      const height = heights.inOrder(order).heightBetween(start, end);
      return Math.round(height + Math.max(0, end - start - 1) * gap);
    },
  };
}

/**
 * The indices to mount: the window's run plus the children that must stay mounted (the focused
 * message, the anchored one, the newest), in order.
 */
export function selectMounted(
  indexOf: ReadonlyMap<string, number>,
  range: WindowRange | null,
  forced: Iterable<string | null | undefined>,
): number[] {
  const mounted = new Set<number>();
  const first = range ? indexOf.get(range.first) : undefined;
  const last = range ? indexOf.get(range.last) : undefined;
  if (first !== undefined && last !== undefined) {
    for (let index = first; index <= last; index += 1) mounted.add(index);
  }
  for (const key of forced) {
    const index = key === null || key === undefined ? undefined : indexOf.get(key);
    if (index !== undefined) mounted.add(index);
  }
  return [...mounted].sort((left, right) => left - right);
}
