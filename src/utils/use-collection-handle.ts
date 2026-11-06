'use client';

import { type Ref, useImperativeHandle } from 'react';
import type {
  CollectionHandle,
  CollectionRevealMiss,
  CollectionRevealResult,
} from '../core/events.js';
import type { Key } from '../core/props.js';
import { toCollectionKey } from './to-collection-key.js';
import { useLatest } from './use-latest.js';
import { useLifetimeSignal } from './use-lifetime-signal.js';

/** The place a virtualized collection's layout gives an item, drawn or not. */
export interface RevealLayout {
  getLayoutInfo: (key: string) => { rect: { y: number; height: number } } | null;
}

/** What a collection tells its handle. */
export interface CollectionHandleSource<O extends object> {
  /** Why the collection does not show the key now, or `null` when it shows it. */
  locate: (key: Key) => CollectionRevealMiss | null;
  /** The collection's element, which holds its rows. */
  getRoot: () => HTMLElement | null;
  /**
   * A virtualized collection's layout and the element it scrolls, to bring a row it has not drawn
   * into the drawn range; `null` for a collection that draws every row.
   */
  virtual: { getLayout: () => RevealLayout | null; getScroller: () => HTMLElement | null } | null;
  /** The element to reveal in a drawn row, such as one cell; the row itself without it. */
  findTarget?: ((row: HTMLElement, options: O | undefined) => HTMLElement | null) | undefined;
}

/** Frames a virtualized collection gets to draw a row after it scrolled to its place. */
const drawFrames = 8;

function findRow(root: HTMLElement | null, key: Key): HTMLElement | null {
  const id = toCollectionKey(key);
  // Collection keys are URI-encoded, so they never hold a quote or a backslash.
  return root?.querySelector<HTMLElement>(`[role="row"][data-key="${id}"]`) ?? null;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Scrolls a virtualized collection so the row's place is in the middle of its view. */
function scrollToPlace(virtual: NonNullable<CollectionHandleSource<object>['virtual']>, key: Key) {
  const scroller = virtual.getScroller();
  const rect = virtual.getLayout()?.getLayoutInfo(toCollectionKey(key))?.rect;
  if (!scroller || !rect) return;
  scroller.scrollTop = Math.max(0, rect.y - (scroller.clientHeight - rect.height) / 2);
  // The virtualizer draws from its scroll event, which a browser sends only after this task.
  scroller.dispatchEvent(new Event('scroll'));
}

/**
 * A collection handle (`CollectionHandle`) on `handleRef`: it finds the row of a key the
 * collection shows, drawing it first in a virtualized collection by scrolling to its place, then
 * scrolls it, or its target, into view with the nearest scroll and focuses it only for `focusKey`.
 * The collection's latest render answers, so rows replaced while a row is drawn are read again.
 */
export function useCollectionHandle<O extends object>(
  handleRef: Ref<CollectionHandle<O>> | undefined,
  source: CollectionHandleSource<O>,
) {
  const latest = useLatest(source);
  const beginReveal = useLifetimeSignal();
  useImperativeHandle(handleRef, () => {
    const reveal = async (
      key: Key,
      options: O | undefined,
      shouldFocus: boolean,
    ): Promise<CollectionRevealResult> => {
      const signal = beginReveal();
      const miss = latest.current.locate(key);
      if (miss) return { found: false, reason: miss };
      let row = findRow(latest.current.getRoot(), key);
      const { virtual } = latest.current;
      if (!row && virtual) scrollToPlace(virtual, key);
      for (let frame = 0; !row && virtual && frame < drawFrames && !signal.aborted; frame += 1) {
        await nextFrame();
        row = findRow(latest.current.getRoot(), key);
      }
      if (signal.aborted) return { found: false, reason: 'unmounted' };
      if (!row) return { found: false, reason: latest.current.locate(key) ?? 'missing' };
      const target = latest.current.findTarget?.(row, options) ?? row;
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (shouldFocus) target.focus({ preventScroll: true });
      return { found: true };
    };
    return {
      revealKey: (key, options) => reveal(key, options, false),
      focusKey: (key, options) => reveal(key, options, true),
    };
  }, [latest, beginReveal]);
}
