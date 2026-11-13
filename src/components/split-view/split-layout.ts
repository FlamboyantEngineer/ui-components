// Sizes of a resizable split's panes: percent panes share the space pixel panes leave, the last
// percent pane (the flexible one) takes what the others leave, and collapsible panes snap shut.
// Pixel panes alone each keep their size; the space they leave stays empty.

import { clamp } from '../../utils/clamp.js';
import { requireDefined } from '../../utils/require-defined.js';

/** `percent`: a share of the space pixel panes leave. `pixel`: a fixed size the split keeps. */
export type SplitViewPaneUnit = 'percent' | 'pixel';

/** How a pane of a resizable split sizes. Sizes are in the pane's unit. */
export interface SplitPaneSize {
  /** The pane's smallest open size. Percent panes default to 10, pixel panes to 0. */
  minSize?: number | undefined;
  /** The pane's largest size. Percent panes default to 90; pixel panes have no limit. */
  maxSize?: number | undefined;
  /** `percent` (the default) or `pixel`, a fixed size kept while the split resizes. */
  unit?: SplitViewPaneUnit | undefined;
  /** The pane collapses below half its smallest size, on Enter on its separator, or on request. */
  collapsible?: boolean | undefined;
  /** The size of the collapsed pane. Defaults to 0. */
  collapsedSize?: number | undefined;
}

/** One pane of a resizable split. */
export interface SplitViewPane extends SplitPaneSize {
  /**
   * The pane's identity and its element's id, named by the separators' `aria-controls`: a pane keeps
   * its content and its size as panes are inserted, removed or reordered around it.
   */
  id: string;
}

/** A separator of a split: the pane its value sizes, and the bounds of that value. */
interface SplitSeparator {
  /** The pane the value sizes: a pixel pane beside the separator, else the pane before it. */
  sized: number;
  /** The pane on the other side, which takes the complement when both are percent panes. */
  partner: number;
  sizedPane: 'before' | 'after';
  /** The value is in pixels. */
  pixel: boolean;
  value: number;
  min: number;
  max: number;
}

interface PaneBounds {
  pixel: boolean;
  min: number;
  max: number;
  collapsible: boolean;
  collapsedSize: number;
}

const defaultMinSize = 10;
const defaultMaxSize = 90;

function resolvePaneBounds(pane: SplitPaneSize | undefined): PaneBounds {
  const pixel = pane?.unit === 'pixel';
  return {
    pixel,
    min: pane?.minSize ?? (pixel ? 0 : defaultMinSize),
    max: pane?.maxSize ?? (pixel ? Number.POSITIVE_INFINITY : defaultMaxSize),
    collapsible: pane?.collapsible ?? false,
    collapsedSize: pane?.collapsedSize ?? 0,
  };
}

function isShut(bounds: PaneBounds, size: number): boolean {
  return bounds.collapsible && size <= bounds.collapsedSize;
}

/** A collapsible pane below half its smallest size snaps shut; other sizes stay. */
function snapShut(bounds: PaneBounds, size: number): number {
  const isBelowHalf = size < (bounds.collapsedSize + bounds.min) / 2;
  return bounds.collapsible && isBelowHalf ? bounds.collapsedSize : size;
}

/** A size within a pane's bounds, or its collapsed size once it snaps shut. */
function snapPaneSize(bounds: PaneBounds, size: number): number {
  const snapped = snapShut(bounds, size);
  return isShut(bounds, snapped) ? snapped : clamp(snapped, bounds.min, bounds.max);
}

/** The percent pane beside `index` that gives or takes its share: the next one, else the previous. */
function findPercentNeighbour(panes: readonly SplitPaneSize[], index: number): number {
  const isPercent = (candidate: number) =>
    candidate !== index && !resolvePaneBounds(panes[candidate]).pixel;
  const after = panes.findIndex((_, candidate) => candidate > index && isPercent(candidate));
  return after !== -1
    ? after
    : panes.findLastIndex((_, candidate) => candidate < index && isPercent(candidate));
}

/** Whether pane `index` is collapsed at `size`. */
export function isSplitPaneCollapsed(pane: SplitPaneSize | undefined, size: number): boolean {
  return isShut(resolvePaneBounds(pane), size);
}

/**
 * The pane that takes the space the others leave: the last percent pane, or -1 when every pane is
 * in pixels, so each keeps its own size and what they leave stays empty.
 */
export function resolveFlexiblePane(panes: readonly SplitPaneSize[]): number {
  return panes.findLastIndex((pane) => pane.unit !== 'pixel');
}

/** The sum of the percent panes' sizes other than pane `skip`. */
function sumOtherShares(bounds: readonly PaneBounds[], sizes: readonly number[], skip: number) {
  return sizes.reduce((sum, size, index) => {
    return index === skip || bounds[index]?.pixel ? sum : sum + size;
  }, 0);
}

/**
 * Moves `excess` percent into (positive) or out of (negative) the flexible pane's share by taking it
 * from or giving it to the open percent panes `givers`, nearest first, within their bounds. Returns
 * what is left over.
 */
function redistribute(
  next: number[],
  {
    bounds,
    givers,
    excess,
  }: { bounds: readonly PaneBounds[]; givers: readonly number[]; excess: number },
): number {
  let left = excess;
  for (const index of givers) {
    const pane = bounds[index];
    const size = next[index] ?? 0;
    if (left === 0 || !pane || isShut(pane, size)) continue;
    const room = left > 0 ? Math.max(0, size - pane.min) : Math.min(0, size - pane.max);
    const delta = left > 0 ? Math.min(left, room) : Math.max(left, room);
    next[index] = size - delta;
    left -= delta;
  }
  return left;
}

/**
 * Keeps a collapsed flexible pane shut: the nearest open percent pane before it takes the share it
 * frees, beyond its own largest size if it must.
 */
function fillCollapsed(
  next: number[],
  {
    bounds,
    flexible,
    givers,
  }: { bounds: readonly PaneBounds[]; flexible: number; givers: readonly number[] },
): number[] {
  const collapsed = bounds[flexible]?.collapsedSize ?? 0;
  next[flexible] = collapsed;
  const nearest = givers.find((index) => !isShut(requireDefined(bounds[index]), next[index] ?? 0));
  if (nearest === undefined) return next;
  next[nearest] = (next[nearest] ?? 0) + 100 - collapsed - sumOtherShares(bounds, next, flexible);
  return next;
}

/**
 * Sizes fitted to the panes: each open pane within its bounds, a collapsed one at its collapsed
 * size, and the flexible pane taking what the other percent panes leave of 100. When that breaks
 * the flexible pane's bounds, the nearest percent panes before it give or take the difference, and
 * its smallest size wins over theirs.
 */
export function normalizeSplitSizes(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
): number[] {
  const bounds = panes.map(resolvePaneBounds);
  const flexible = resolveFlexiblePane(panes);
  const next = bounds.map((pane, index) => snapPaneSize(pane, sizes[index] ?? 0));
  const own = bounds[flexible];
  if (!own || own.pixel) return next;
  const givers = bounds
    .map((pane, index) => (index === flexible || pane.pixel ? -1 : index))
    .filter((index) => index !== -1)
    .reverse();
  const given = sizes[flexible];
  if (given !== undefined && isShut(own, given))
    return fillCollapsed(next, { bounds, flexible, givers });
  const share = 100 - sumOtherShares(bounds, next, flexible);
  // A share below zero is no collapse: the pane takes its smallest size and the others give it.
  const wanted = share >= 0 && isShut(own, share) ? share : clamp(share, own.min, own.max);
  const left = redistribute(next, { bounds, givers, excess: wanted - share });
  const nearest = givers[0];
  if (left > 0 && nearest !== undefined) next[nearest] = Math.max(0, (next[nearest] ?? 0) - left);
  next[flexible] = 100 - sumOtherShares(bounds, next, flexible);
  return next;
}

/**
 * Sizes taken for the panes `from` names, moved to the panes `to` names: a pane keeps its size by
 * its id wherever it moves, and a new pane takes its `initial` size.
 */
export function alignSplitSizes(
  sizes: readonly number[],
  {
    from,
    to,
    initial,
  }: { from: readonly string[]; to: readonly string[]; initial: readonly number[] },
): readonly number[] {
  if (from.length === to.length && from.every((id, index) => id === to[index])) return sizes;
  return to.map((id, index) => {
    const at = from.indexOf(id);
    return at === -1 ? (initial[index] ?? 0) : (sizes[at] ?? 0);
  });
}

/** The starting sizes: the given ones, else equal shares for percent panes and the smallest size for pixel panes. */
export function resolveInitialSplitSizes(
  panes: readonly SplitPaneSize[],
  defaultSizes?: readonly number[] | null,
): number[] {
  const shares = panes.filter((pane) => pane.unit !== 'pixel').length;
  const sizes = panes.map(
    (pane, index) =>
      defaultSizes?.[index] ??
      (pane.unit === 'pixel' ? (pane.minSize ?? 0) : 100 / Math.max(1, shares)),
  );
  return normalizeSplitSizes(panes, sizes);
}

/**
 * The separator between pane `index` and the next one. Between percent panes its value is the pane
 * before it, bounded by both panes (a collapsible pane may go down to its collapsed size); beside a
 * pixel pane its value is that pane's size, up to `available` pixels more (unlimited while the split
 * is unmeasured, up to the pane's largest size).
 */
export function resolveSplitSeparator(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
  { index, available }: { index: number; available: number },
): SplitSeparator {
  const before = resolvePaneBounds(panes[index]);
  const after = resolvePaneBounds(panes[index + 1]);
  const afterSized = !before.pixel && after.pixel;
  const [sized, partner] = afterSized ? [index + 1, index] : [index, index + 1];
  const own = afterSized ? after : before;
  const other = afterSized ? before : after;
  const value = sizes[sized] ?? 0;
  const lowest = own.collapsible ? own.collapsedSize : own.min;
  const base = { sized, partner, sizedPane: afterSized ? 'after' : 'before', value } as const;
  if (own.pixel) {
    return {
      ...base,
      pixel: true,
      min: lowest,
      max: Math.max(lowest, Math.min(own.max, value + available)),
    };
  }
  const total = value + (sizes[partner] ?? 0);
  const min = own.collapsible ? lowest : Math.max(lowest, total - other.max);
  const max = other.collapsible
    ? total - other.collapsedSize
    : Math.min(own.max, total - other.min);
  const low = clamp(min, 0, total);
  const high = clamp(max, 0, total);
  return { ...base, pixel: false, min: Math.min(low, high), max: high };
}

/**
 * The sizes after a separator moves to `value`: its sized pane takes the value, snapping shut below
 * half its smallest size, and a percent partner takes the complement, snapping shut the same way.
 */
export function applySplitSeparatorValue(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
  { index, available, value }: { index: number; available: number; value: number },
): number[] {
  const separator = resolveSplitSeparator(panes, sizes, { index, available });
  const own = resolvePaneBounds(panes[separator.sized]);
  const next = [...sizes];
  const raw = clamp(value, separator.min, separator.max);
  if (separator.pixel) {
    const snapped = snapShut(own, raw);
    next[separator.sized] = isShut(own, snapped) ? snapped : clamp(raw, own.min, separator.max);
    return next;
  }
  const other = resolvePaneBounds(panes[separator.partner]);
  const total = separator.value + (sizes[separator.partner] ?? 0);
  let sized = snapShut(own, raw);
  if (!isShut(own, sized)) {
    const partner = snapPaneSize(other, total - sized);
    sized = isShut(other, partner)
      ? total - partner
      : clamp(
          total - partner,
          Math.max(own.min, total - other.max),
          Math.min(own.max, total - other.min),
        );
  }
  next[separator.sized] = sized;
  next[separator.partner] = total - sized;
  return next;
}

/**
 * The sizes with pane `index` collapsed; the neighbouring percent pane, after it when there is one,
 * takes the freed share. A pane that cannot collapse, or already has, keeps the sizes.
 */
export function collapseSplitPane(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
  index: number,
): readonly number[] {
  const pane = resolvePaneBounds(panes[index]);
  const size = sizes[index] ?? 0;
  if (!pane.collapsible || isShut(pane, size)) return sizes;
  const next = [...sizes];
  next[index] = pane.collapsedSize;
  if (pane.pixel) return next;
  const neighbour = findPercentNeighbour(panes, index);
  if (neighbour === -1) return sizes;
  next[neighbour] = (next[neighbour] ?? 0) + size - pane.collapsedSize;
  return next;
}

/**
 * The sizes with collapsed pane `index` open again at `size` (its smallest size by default, within
 * its bounds), taking the share from the neighbouring percent pane down to that pane's smallest size,
 * and further when the opened pane would stay below its own.
 */
export function expandSplitPane(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
  { index, size }: { index: number; size?: number | undefined },
): readonly number[] {
  const pane = resolvePaneBounds(panes[index]);
  const current = sizes[index] ?? 0;
  if (!isShut(pane, current)) return sizes;
  const target = clamp(size ?? pane.min, pane.min, pane.max);
  const next = [...sizes];
  if (pane.pixel) {
    next[index] = target;
    return next;
  }
  const neighbour = findPercentNeighbour(panes, index);
  if (neighbour === -1) return sizes;
  const giver = resolvePaneBounds(panes[neighbour]);
  const total = current + (sizes[neighbour] ?? 0);
  const opened = Math.max(pane.min, Math.min(target, total - giver.min));
  next[index] = Math.min(opened, total);
  next[neighbour] = total - requireDefined(next[index]);
  return next;
}

/**
 * A pane's inline flex basis: a pixel pane's size, a percent pane's share of the space the pixel
 * panes leave, and none for the flexible pane, which takes what remains. A pixel pane is never the
 * flexible one.
 */
export function resolveSplitPaneBasis(
  panes: readonly SplitPaneSize[],
  sizes: readonly number[],
  index: number,
): string | undefined {
  if (index === resolveFlexiblePane(panes)) return undefined;
  const size = sizes[index] ?? 0;
  if (panes[index]?.unit === 'pixel') return `${size}px`;
  const fixed = panes.reduce(
    (sum, pane, other) => (pane.unit === 'pixel' ? sum + (sizes[other] ?? 0) : sum),
    0,
  );
  return fixed === 0 ? `${size}%` : `calc((100% - ${fixed}px) * ${size / 100})`;
}
