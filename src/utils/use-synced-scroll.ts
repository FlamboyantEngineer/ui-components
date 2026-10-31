'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { clamp } from './clamp.js';
import { mapScrollOffset, type ScrollAnchor } from './scroll-offset-map.js';
import { isHTMLElement } from './is-element.js';

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

/** A container's anchors as read, with the sizes they were read at. */
interface ReadAnchors {
  anchors: readonly ScrollAnchor[];
  scrollHeight: number;
  clientHeight: number;
}

interface ScrollSync {
  containers: Set<HTMLElement>;
  echoes: Map<HTMLElement, number>;
  options: SyncedScrollOptions;
  /** Each container's anchors, kept until the observers see it or its content change. */
  anchors: Map<HTMLElement, ReadAnchors>;
  /** Watches the containers and their content; null where the observers are missing. */
  observers: { resize: ResizeObserver; mutation: MutationObserver } | null;
}

function resolveElement(target: SyncedScrollTarget): HTMLElement | null {
  if (!target) return null;
  return 'current' in target ? target.current : target;
}

function scrollRange(element: HTMLElement): number {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

/**
 * A container's anchors: the kept ones while the observers have seen no change and its sizes match,
 * else read afresh (and kept when observers watch).
 */
function readAnchors(
  sync: ScrollSync,
  container: HTMLElement,
  getAnchors: NonNullable<SyncedScrollOptions['getAnchors']>,
): readonly ScrollAnchor[] {
  const { scrollHeight, clientHeight } = container;
  const kept = sync.anchors.get(container);
  if (kept && kept.scrollHeight === scrollHeight && kept.clientHeight === clientHeight) {
    return kept.anchors;
  }
  const anchors = getAnchors(container);
  if (sync.observers) sync.anchors.set(container, { anchors, scrollHeight, clientHeight });
  return anchors;
}

/** Watches each container and its direct children for size changes, and its subtree for edits. */
function observeContainers({ containers, observers }: ScrollSync): void {
  if (!observers) return;
  observers.resize.disconnect();
  observers.mutation.disconnect();
  for (const container of containers) {
    observers.resize.observe(container);
    for (const child of container.children) observers.resize.observe(child);
    observers.mutation.observe(container, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
  }
}

function isContainer({ containers }: ScrollSync, node: Node): boolean {
  return isHTMLElement(node) && containers.has(node);
}

function createObservers(sync: ScrollSync): ScrollSync['observers'] {
  if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return null;
  const forget = () => sync.anchors.clear();
  return {
    resize: new ResizeObserver(forget),
    mutation: new MutationObserver((records) => {
      forget();
      // Children that came or went change what the resize observer watches.
      if (records.some(({ type, target }) => type === 'childList' && isContainer(sync, target))) {
        observeContainers(sync);
      }
    }),
  };
}

function syncScroll(source: HTMLElement, sync: ScrollSync): void {
  const { containers, echoes, options } = sync;
  const echo = echoes.get(source);
  echoes.delete(source);
  const offset = source.scrollTop;
  if (echo !== undefined && Math.abs(echo - offset) < 1) return;
  const { getAnchors } = options;
  const from = getAnchors && readAnchors(sync, source, getAnchors);
  const fraction = offset / (scrollRange(source) || 1);
  for (const target of containers) {
    if (target === source) continue;
    const range = scrollRange(target);
    const top = clamp(
      from && getAnchors
        ? mapScrollOffset(offset, from, readAnchors(sync, target, getAnchors))
        : fraction * range,
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
 * the hook sets itself do not echo back. Targets are read after every commit. Anchors are read
 * again only after a container or its content changes, so a scroll only maps offsets.
 */
export function useSyncedScroll(
  targets: readonly SyncedScrollTarget[],
  options: SyncedScrollOptions = {},
): void {
  const state = useRef<ScrollSync>({
    containers: new Set(),
    echoes: new Map(),
    options,
    anchors: new Map(),
    observers: null,
  });
  const onScroll = useCallback((event: Event) => {
    syncScroll(event.currentTarget as HTMLElement, state.current);
  }, []);

  useLayoutEffect(() => {
    const current = state.current;
    if (current.options.getAnchors !== options.getAnchors) current.anchors.clear();
    current.options = options;
    const wanted = new Set(targets.map(resolveElement).filter((element) => element !== null));
    if (options.enabled === false || wanted.size < 2) wanted.clear();
    for (const container of current.containers) {
      if (wanted.has(container)) continue;
      container.removeEventListener('scroll', onScroll);
      current.echoes.delete(container);
      current.anchors.delete(container);
    }
    let isChanged = wanted.size !== current.containers.size;
    for (const container of wanted) {
      if (current.containers.has(container)) continue;
      container.addEventListener('scroll', onScroll, { passive: true });
      isChanged = true;
    }
    current.containers = wanted;
    const isWatching = current.observers !== null;
    if (options.getAnchors) current.observers ??= createObservers(current);
    if (isChanged || (!isWatching && current.observers)) observeContainers(current);
  });

  useLayoutEffect(() => {
    const current = state.current;
    return () => {
      for (const container of current.containers) container.removeEventListener('scroll', onScroll);
      current.containers.clear();
      current.echoes.clear();
      current.anchors.clear();
      current.observers?.resize.disconnect();
      current.observers?.mutation.disconnect();
    };
  }, [onScroll]);
}
