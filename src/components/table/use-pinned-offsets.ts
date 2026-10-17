import { useCallback, useState } from 'react';
import type { TableColumnPin } from './table-rows.js';

/** How far each pinned column sits from its edge, in pixels, by column key. */
export type TablePinOffsets = Readonly<Record<string, number>>;

/** A drawn column's key, width in pixels and pin, in display order. */
export interface PinnedColumnWidth {
  key: string;
  width: number;
  pin: TableColumnPin | undefined;
}

export interface PinnedOffsets {
  offsets: TablePinOffsets;
  /** Takes freshly computed offsets, keeping the current ones when nothing moved. */
  report: (offsets: TablePinOffsets) => void;
}

const noOffsets: TablePinOffsets = {};

function sumWidths(columns: readonly PinnedColumnWidth[], pin: TableColumnPin) {
  const offsets: Record<string, number> = {};
  let offset = 0;
  for (const column of columns) {
    if (column.pin !== pin) continue;
    offsets[column.key] = offset;
    offset += column.width;
  }
  return offsets;
}

function isSameOffsets(left: TablePinOffsets, right: TablePinOffsets): boolean {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
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
    setOffsets((current) => (isSameOffsets(current, next) ? current : next));
  }, []);
  return { offsets: isActive ? offsets : noOffsets, report };
}
