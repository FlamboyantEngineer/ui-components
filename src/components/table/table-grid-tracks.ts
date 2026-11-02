// The column tracks of a table drawn as a CSS grid: every column's declared, measured or resized
// width as a grid track, so the browser sizes the columns from the scroll area's CSS width in the
// same layout pass as the area itself (specs/TABLE.md, UIC-TABLE-4.6).

import { readOwn } from '../../utils/read-own.js';
import { getColumnBounds, resolveColumnWidth, type TableColumnWidths } from './column-sizing.js';
import type { TableColumn } from './table-rows.js';
import type { TableStructure } from './table-structure.js';

/** The least width of a flexible column without a minimum, as React Aria's columns had. */
const defaultFlexibleMinWidth = 75;

/**
 * One column's track: pixels as they are; a percentage of the grid's width kept inside the
 * column's bounds; a share (`fr`) of the room the other columns leave, never below the minimum
 * (75 pixels without one) and, with a maximum, growing up to it before the uncapped shares split
 * what remains.
 */
export function toGridTrack<T>(column: TableColumn<T>, width: number | string): string {
  if (typeof width === 'number') return `${width}px`;
  const { minWidth, maxWidth } = getColumnBounds(column);
  if (width.endsWith('%')) {
    if (minWidth !== undefined && maxWidth !== undefined)
      return `clamp(${minWidth}px, ${width}, ${maxWidth}px)`;
    if (minWidth !== undefined) return `max(${minWidth}px, ${width})`;
    return maxWidth === undefined ? width : `min(${width}, ${maxWidth}px)`;
  }
  const least = `${minWidth ?? defaultFlexibleMinWidth}px`;
  return `minmax(${least}, ${maxWidth === undefined ? width : `${maxWidth}px`})`;
}

interface GridTracksInput<T> {
  structure: TableStructure<T>;
  /** Stored, resized or restored widths by column id. */
  widths: TableColumnWidths;
  contentWidths: Readonly<Record<string, number>>;
  selectionWidth: number;
}

/** The grid's track list: the selection column, the data columns, then the actions column. */
export function readGridTracks<T>(input: GridTracksInput<T>): string {
  const { structure } = input;
  const tracks = structure.columns.map((column) =>
    toGridTrack(
      column,
      resolveColumnWidth(
        column,
        readOwn(input.widths, column.id),
        readOwn(input.contentWidths, column.id),
      ),
    ),
  );
  if (structure.hasSelection) tracks.unshift(`${input.selectionWidth}px`);
  if (structure.hasActions) tracks.push(`${structure.actionsColumnWidth}px`);
  return tracks.join(' ');
}
