'use client';

import { useLayoutEffect } from 'react';
import type { TablePinOffsets } from './use-pinned-offsets.js';

interface PinnedRowProbeOptions {
  /** The row is pinned in a static table. */
  isActive: boolean;
  /** The header and the summary stay in view, so pinned rows stick beside them. */
  hasStickyEdges: boolean;
  /** Takes the offsets, by row collection key. */
  report: (offsets: TablePinOffsets) => void;
}

function readSection(grid: HTMLElement, slot: 'header' | 'footer'): HTMLElement | null {
  return grid.querySelector<HTMLElement>(`:scope > .ui-table__${slot}`);
}

function listPinnedRows(grid: HTMLElement): HTMLElement[] {
  return [
    ...grid.querySelectorAll<HTMLElement>(':scope > .ui-table__body > .ui-table__row[data-pinned]'),
  ];
}

/**
 * Each pinned row's distance from its edge of the scroll area: the sticky header's or summary's
 * height, then the heights of the rows pinned between it and that edge.
 */
function measureRowOffsets(grid: HTMLElement, hasStickyEdges: boolean): TablePinOffsets {
  // No prototype: a row key such as `__proto__` is a key like any other.
  const offsets = Object.create(null) as Record<string, number>;
  const rows = listPinnedRows(grid);
  const stack = (pinned: readonly HTMLElement[], start: number) => {
    let offset = start;
    for (const row of pinned) {
      const key = row.getAttribute('data-key');
      if (key !== null) offsets[key] = offset;
      offset += row.offsetHeight;
    }
  };
  const edge = (slot: 'header' | 'footer') =>
    hasStickyEdges ? (readSection(grid, slot)?.offsetHeight ?? 0) : 0;
  stack(
    rows.filter((row) => row.dataset['pinned'] === 'top'),
    edge('header'),
  );
  stack(rows.filter((row) => row.dataset['pinned'] === 'bottom').reverse(), edge('footer'));
  return offsets;
}

/**
 * Measures where a static table's pinned rows stick, from a pinned row: after each of its renders
 * and whenever the header, the summary or a pinned row changes size.
 */
export function usePinnedRowProbe(
  row: HTMLElement | null,
  { isActive, hasStickyEdges, report }: PinnedRowProbeOptions,
): void {
  useLayoutEffect(() => {
    const grid = row?.closest<HTMLElement>('.ui-table__grid');
    if (!isActive || !grid) return undefined;
    const measure = () => report(measureRowOffsets(grid, hasStickyEdges));
    measure();
    const view = grid.ownerDocument.defaultView;
    if (!view?.ResizeObserver) return undefined;
    const observer = new view.ResizeObserver(measure);
    const sections = [readSection(grid, 'header'), readSection(grid, 'footer')];
    for (const element of [...sections, ...listPinnedRows(grid)]) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  });
}
