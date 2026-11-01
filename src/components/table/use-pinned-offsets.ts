'use client';

import { useCallback, useState } from 'react';
import type { TableColumnPin } from './table-rows.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';

/** How far each pinned column sits from its edge, in pixels, by column key. */
export type TablePinOffsets = Readonly<Record<string, number>>;

/** A drawn column's key, width in pixels and pin, in display order. */
interface PinnedColumnWidth {
  key: string;
  width: number;
  pin: TableColumnPin | undefined;
}

interface PinnedOffsets {
  offsets: TablePinOffsets;
  /** Takes freshly computed offsets, keeping the current ones when nothing moved. */
  report: (offsets: TablePinOffsets) => void;
}

const noOffsets: TablePinOffsets = {};

function sumWidths(columns: readonly PinnedColumnWidth[], pin: TableColumnPin) {
  // No prototype: a column key such as `__proto__` is a key like any other.
  const offsets = Object.create(null) as Record<string, number>;
  let offset = 0;
  for (const column of columns) {
    if (column.pin !== pin) continue;
    offsets[column.key] = offset;
    offset += column.width;
  }
  return offsets;
}

/**
 * Each pinned column's distance from its edge: the summed widths of the columns pinned to the
 * same edge between it and that edge.
 */
export function computePinOffsets(columns: readonly PinnedColumnWidth[]): TablePinOffsets {
  return { ...sumWidths(columns, 'start'), ...sumWidths([...columns].reverse(), 'end') };
}

/** The offsets of a table's pinned columns, as the header last reported them. */
export function usePinnedOffsets(isActive: boolean): PinnedOffsets {
  const [offsets, setOffsets] = useState(noOffsets);
  const report = useCallback((next: TablePinOffsets) => {
    setOffsets((current) => (isShallowEqual(current, next) ? current : next));
  }, []);
  return { offsets: isActive ? offsets : noOffsets, report };
}
