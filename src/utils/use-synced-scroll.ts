'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { clamp } from './clamp.js';
import type { Key } from '../core/props.js';
import { requireDefined } from './require-defined.js';

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

interface ScrollSync {
  containers: Set<HTMLElement>;
  echoes: Map<HTMLElement, number>;
  options: SyncedScrollOptions;
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
    if (requireDefined(pairs[middle])[0] <= offset) {
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
  const [start, startTarget] = requireDefined(pairs[index]);
  const next = pairs[index + 1];
  if (!next || next[0] <= start) return startTarget + (offset - start);
  return startTarget + ((offset - start) / (next[0] - start)) * (next[1] - startTarget);
}

function syncScroll(source: HTMLElement, { containers, echoes, options }: ScrollSync): void {
  const echo = echoes.get(source);
  echoes.delete(source);
  const offset = source.scrollTop;
  if (echo !== undefined && Math.abs(echo - offset) < 1) return;
  const { getAnchors } = options;
  const from = getAnchors?.(source);
  const fraction = offset / (scrollRange(source) || 1);
  for (const target of containers) {
    if (target === source) continue;
    const range = scrollRange(target);
    const top = clamp(
      from && getAnchors ? mapScrollOffset(offset, from, getAnchors(target)) : fraction * range,
      0,
      range,
    );
    if (Math.abs(target.scrollTop - top) < 1) continue;
    target.scrollTop = top;
    echoes.set(target, target.scrollTop);
  }
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
  const state = useRef<ScrollSync>({ containers: new Set(), echoes: new Map(), options });
  const onScroll = useCallback((event: Event) => {
    syncScroll(event.currentTarget as HTMLElement, state.current);
  }, []);

  useLayoutEffect(() => {
    const current = state.current;
    current.options = options;
    const wanted = new Set(targets.map(resolveElement).filter((element) => element !== null));
    if (options.enabled === false || wanted.size < 2) wanted.clear();
    for (const container of current.containers) {
      if (wanted.has(container)) continue;
      container.removeEventListener('scroll', onScroll);
      current.echoes.delete(container);
    }
    for (const container of wanted) {
      if (!current.containers.has(container)) {
        container.addEventListener('scroll', onScroll, { passive: true });
      }
    }
    current.containers = wanted;
  });

  useLayoutEffect(() => {
    const current = state.current;
    return () => {
      for (const container of current.containers) container.removeEventListener('scroll', onScroll);
      current.containers.clear();
      current.echoes.clear();
    };
  }, [onScroll]);
}
