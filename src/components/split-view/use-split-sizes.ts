'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUiStorage, type PersistCodec } from '../../core/provider.js';
import { createJsonCodec } from '../../utils/json-codec.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';
import { useOwnedPreview } from '../../utils/use-owned-preview.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import { useStableArray } from '../../utils/use-stable-array.js';
import {
  alignSplitSizes,
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
   * Changes when the storage, the key or the panes' units and bounds change. A drag or a preview
   * begun for an earlier owner is abandoned, so it never lands in the new one.
   */
  owner: object;
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
  return createJsonCodec(
    (value): number[] => {
      if (isPair && isSize(value)) return [value, 100 - value];
      const isList = Array.isArray(value) && value.length === panes.length && value.every(isSize);
      if (!isList) throw new TypeError('Stored split sizes do not fit the panes');
      return value;
    },
    (sizes) => (isPair ? sizes[0] : sizes),
  );
}

function isSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * The panes' units and bounds, which decide what stored sizes and a drag's values mean; the same
 * list while they hold the same values.
 */
function usePaneShape(panes: readonly SplitViewPane[]) {
  return useStableArray(
    panes.map((pane) => ({
      unit: pane.unit ?? 'percent',
      minSize: pane.minSize,
      maxSize: pane.maxSize,
      collapsible: pane.collapsible ?? false,
      collapsedSize: pane.collapsedSize,
    })),
  );
}

/** Reopening sizes, held for the owner they were taken under. */
interface Owned<T> {
  owner: object;
  value: T;
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
  const persistedKey = controlled ? undefined : persistKey;
  const adapter = useUiStorage();
  const owner = useShallowStable({
    key: persistedKey,
    storage: persistedKey === undefined ? undefined : adapter,
    shape: usePaneShape(panes),
  });
  const codec = useMemo(() => createSizesCodec(panes), [panes]);
  const getInitial = () =>
    resolveInitialSplitSizes(panes, options.defaultSizes ?? toPair(options.defaultSize));
  const ids = panes.map((pane) => pane.id);
  const [stored, setStored] = usePersistedValue<number[]>({
    value: undefined,
    defaultValue: getInitial,
    persistKey: persistedKey,
    codec,
  });
  // The panes the committed sizes were taken for: inserted, removed or moved panes keep theirs.
  const [storedIds, setStoredIds] = useState(ids);
  const committed = alignSplitSizes(stored, { from: storedIds, to: ids, initial: getInitial() });
  const setCommitted = (next: number[]) => {
    setStored(next);
    setStoredIds(ids);
  };
  const [preview, setPreview] = useOwnedPreview<readonly number[]>(owner);
  const current = normalizeSplitSizes(panes, controlled ?? preview ?? committed);
  const latest = useRef(current);
  const reopened = useRef<Owned<Map<number, number>>>({ owner, value: new Map() });
  // A pane reopens at its size before collapsing only under the owner it collapsed in.
  const reopen = () => {
    if (reopened.current.owner !== owner) reopened.current = { owner, value: new Map() };
    return reopened.current.value;
  };
  useLayoutEffect(() => {
    latest.current = current;
  });

  const reportCollapse = (previous: readonly number[], next: readonly number[]) => {
    next.forEach((size, index) => {
      const was = isSplitPaneCollapsed(panes[index], previous[index] ?? 0);
      const is = isSplitPaneCollapsed(panes[index], size);
      if (!was && is) {
        reopen().set(index, previous[index] ?? 0);
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
      setPreview(isEnd ? null : next);
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
    owner,
    update,
    collapse(index) {
      const next = collapseSplitPane(panes, latest.current, index);
      if (next !== latest.current) update(next, 'set');
    },
    expand(index) {
      const size = reopen().get(index);
      const next = expandSplitPane(panes, latest.current, { index, size });
      if (next !== latest.current) update(next, 'set');
    },
  };
}
