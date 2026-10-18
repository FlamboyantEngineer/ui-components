import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import type { Key } from '../core/props.js';

/** A container to keep aligned: the element, or a ref whose element is stable. */
export type SyncedScrollTarget = HTMLElement | RefObject<HTMLElement | null> | null | undefined;

/** A point of a container's content that has a match in the other containers. */
export interface ScrollAnchor {
  /** Identifies the anchor across containers. */
  key: Key;
  /** Its distance from the top of the container's content, in pixels. */
  offset: number;
}

export interface SyncedScrollOptions {
  /**
   * Reads a container's anchors in reading order. With it, containers align matched anchors;
   * without it, they align the same fraction of their scroll range.
   */
  readonly getAnchors?: ((container: HTMLElement) => readonly ScrollAnchor[]) | undefined;
  /** False stops aligning. Defaults to true. */
  readonly enabled?: boolean | undefined;
}

function resolveElement(target: SyncedScrollTarget): HTMLElement | null {
  if (!target) return null;
  return 'current' in target ? target.current : target;
}

function scrollRange(element: HTMLElement): number {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

/** The index of the last pair whose source offset is at most `offset`, or -1. */
function findPair(pairs: ReadonlyArray<readonly [number, number]>, offset: number): number {
  let low = 0;
  let high = pairs.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (pairs[middle]![0] <= offset) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

/**
 * Maps a scroll offset of one container onto another through the anchors both have: between two
 * matched anchors the offset moves in proportion, before the first and after the last it keeps its
 * distance from that anchor. Without a matched anchor the offset is returned unchanged.
 */
export function mapScrollOffset(
  offset: number,
  from: readonly ScrollAnchor[],
  to: readonly ScrollAnchor[],
): number {
  const targets = new Map(to.map((anchor) => [anchor.key, anchor.offset]));
  const pairs = from.flatMap((anchor): Array<readonly [number, number]> => {
    const target = targets.get(anchor.key);
    return target === undefined ? [] : [[anchor.offset, target]];
  });
  const first = pairs[0];
  if (!first) return offset;
  const index = findPair(pairs, offset);
  if (index < 0) return first[1] - (first[0] - offset);
  const [start, startTarget] = pairs[index]!;
  const next = pairs[index + 1];
  if (!next || next[0] <= start) return startTarget + (offset - start);
  return startTarget + ((offset - start) / (next[0] - start)) * (next[1] - startTarget);
}

function resolveTop(source: HTMLElement, target: HTMLElement, options: SyncedScrollOptions) {
  const { getAnchors } = options;
  const top = getAnchors
    ? mapScrollOffset(source.scrollTop, getAnchors(source), getAnchors(target))
    : (source.scrollTop / (scrollRange(source) || 1)) * scrollRange(target);
  return Math.min(Math.max(0, top), scrollRange(target));
}

/**
 * Keeps the vertical scroll position of two or more containers aligned: scrolling one scrolls the
 * others, by the same fraction of their range or through matched anchors (`getAnchors`). Positions
 * the hook sets itself do not echo back. Targets are read after every commit.
 */
export function useSyncedScroll(
  targets: readonly SyncedScrollTarget[],
  options: SyncedScrollOptions = {},
): void {
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const containers = targets.map(resolveElement).filter((element) => element !== null);
    if (latest.current.enabled === false || containers.length < 2) return undefined;
    const echoes = new Map<HTMLElement, number>();
    const onScroll = (event: Event) => {
      const source = event.currentTarget as HTMLElement;
      const echo = echoes.get(source);
      echoes.delete(source);
      if (echo !== undefined && Math.abs(echo - source.scrollTop) < 1) return;
      for (const target of containers) {
        if (target === source) continue;
        const top = resolveTop(source, target, latest.current);
        if (Math.abs(target.scrollTop - top) < 1) continue;
        target.scrollTop = top;
        echoes.set(target, target.scrollTop);
      }
    };
    for (const container of containers) {
      container.addEventListener('scroll', onScroll, { passive: true });
    }
    return () => {
      for (const container of containers) container.removeEventListener('scroll', onScroll);
    };
  });
}
