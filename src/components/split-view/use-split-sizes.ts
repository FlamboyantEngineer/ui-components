'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePersistentState, type PersistCodec } from '../../core/provider.js';
import {
  collapseSplitPane,
  expandSplitPane,
  isSplitPaneCollapsed,
  normalizeSplitSizes,
  resolveInitialSplitSizes,
  type SplitViewPane,
} from './split-layout.js';

export interface SplitSizesOptions {
  panes: readonly SplitViewPane[];
  /** Every pane's size (controlled). */
  sizes?: readonly number[] | undefined;
  defaultSizes?: readonly number[] | undefined;
  /** The first of two panes' size (controlled). */
  size?: number | undefined;
  defaultSize?: number | undefined;
  persistKey?: string | undefined;
  onSizesChange?: ((sizes: number[]) => void) | undefined;
  onSizesChangeEnd?: ((sizes: number[]) => void) | undefined;
  onSizeChange?: ((size: number) => void) | undefined;
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  onCollapse?: ((index: number) => void) | undefined;
  onExpand?: ((index: number) => void) | undefined;
}

type SplitSizesPhase = 'change' | 'end' | 'set';

export interface SplitSizes {
  /** Every pane's size, fitted to the panes. */
  current: readonly number[];
  /**
   * Applies new sizes: `change` live during a drag or a key step, `end` committed (and saved) when
   * it ends, `set` both at once.
   */
  update: (next: readonly number[], phase: SplitSizesPhase) => void;
  /** Collapses pane `index` if it can. */
  collapse: (index: number) => void;
  /** Opens collapsed pane `index` at its size before collapsing. */
  expand: (index: number) => void;
}

/** Two percent panes store the first pane's size as a number, as they always have; others a list. */
function createSizesCodec(panes: readonly SplitViewPane[]): PersistCodec<number[]> {
  const isPair = panes.length === 2 && panes.every((pane) => pane.unit !== 'pixel');
  return {
    parse(raw) {
      const value: unknown = JSON.parse(raw);
      if (isPair && typeof value === 'number' && Number.isFinite(value))
        return [value, 100 - value];
      const isList =
        Array.isArray(value) &&
        value.length === panes.length &&
        value.every((size) => typeof size === 'number' && Number.isFinite(size));
      if (!isList) throw new Error('Stored split sizes do not fit the panes');
      return value as number[];
    },
    stringify: (sizes) => (isPair ? String(sizes[0]) : JSON.stringify(sizes)),
  };
}

function toPair(size: number | undefined): number[] | undefined {
  return size === undefined ? undefined : [size, 100 - size];
}

/**
 * The panes' sizes: the controlled `sizes` (or two-pane `size`), else the live sizes during a drag,
 * else the committed sizes, which persist. Collapsing and opening a pane are reported, and the size
 * a pane had before collapsing is kept to open it again.
 */
export function useSplitSizes(options: SplitSizesOptions): SplitSizes {
  const { panes, persistKey } = options;
  const controlled = options.sizes ?? toPair(options.size);
  const codec = useMemo(() => createSizesCodec(panes), [panes]);
  const [committed, setCommitted] = usePersistentState<number[]>(
    controlled ? undefined : persistKey,
    () => resolveInitialSplitSizes(panes, options.defaultSizes ?? toPair(options.defaultSize)),
    codec,
  );
  const [live, setLive] = useState<readonly number[] | null>(null);
  const current = normalizeSplitSizes(panes, controlled ?? live ?? committed);
  const latest = useRef(current);
  const reopen = useRef(new Map<number, number>());
  useLayoutEffect(() => {
    latest.current = current;
  });

  const reportCollapse = (previous: readonly number[], next: readonly number[]) => {
    next.forEach((size, index) => {
      const was = isSplitPaneCollapsed(panes[index], previous[index] ?? 0);
      const is = isSplitPaneCollapsed(panes[index], size);
      if (!was && is) {
        reopen.current.set(index, previous[index] ?? 0);
        options.onCollapse?.(index);
      } else if (was && !is) options.onExpand?.(index);
    });
  };
  const update = (sizes: readonly number[], phase: SplitSizesPhase) => {
    const next = normalizeSplitSizes(panes, sizes);
    const isEnd = phase !== 'change';
    reportCollapse(latest.current, next);
    latest.current = next;
    if (!controlled) {
      if (isEnd) setCommitted(next);
      setLive(isEnd ? null : next);
    }
    if (phase !== 'end') {
      options.onSizesChange?.(next);
      options.onSizeChange?.(next[0] ?? 0);
    }
    if (!isEnd) return;
    options.onSizesChangeEnd?.(next);
    options.onSizeChangeEnd?.(next[0] ?? 0);
  };
  return {
    current,
    update,
    collapse(index) {
      const next = collapseSplitPane(panes, latest.current, index);
      if (next !== latest.current) update(next, 'set');
    },
    expand(index) {
      const size = reopen.current.get(index);
      const next = expandSplitPane(panes, latest.current, { index, size });
      if (next !== latest.current) update(next, 'set');
    },
  };
}
