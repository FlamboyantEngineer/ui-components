'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { clamp } from './clamp.js';
import { mapScrollOffset, type ScrollAnchor } from './scroll-offset-map.js';

/** A container to keep aligned: the element, or a ref whose element is stable. */
export type SyncedScrollTarget = HTMLElement | RefObject<HTMLElement | null> | null | undefined;

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
