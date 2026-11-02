// The column tracks of a table drawn as a CSS grid: every column's declared, measured or resized
// width as a grid track, so the browser sizes the columns from the scroll area's CSS width in the
// same layout pass as the area itself (specs/TABLE.md, UIC-TABLE-4.6).

import { readOwn } from '../../utils/read-own.js';
import { getColumnBounds, resolveColumnWidth, type TableColumnWidths } from './column-sizing.js';
import type { TableColumn } from './table-rows.js';
import type { TableStructure } from './table-structure.js';

/** The least width of a flexible column without a minimum, as React Aria's columns had. */
const defaultFlexibleMinWidth = 75;

/** A flexible column's share: its weight and bounds. */
interface Share {
  weight: number;
  minWidth: number;
  maxWidth: number | undefined;
}

/** The share of an `fr` width, else null. */
function readShare<T>(column: TableColumn<T>, width: number | string): Share | null {
  if (typeof width === 'number' || !width.endsWith('fr')) return null;
  const { minWidth, maxWidth } = getColumnBounds(column);
  const weight = Number.parseFloat(width);
  return { weight, minWidth: minWidth ?? defaultFlexibleMinWidth, maxWidth };
}

/**
 * One column's fixed track: pixels as they are, or a percentage of the grid's width kept inside
 * the column's bounds.
 */
function toFixedTrack<T>(column: TableColumn<T>, width: number | string): string {
  if (typeof width === 'number') return `${width}px`;
  const { minWidth, maxWidth } = getColumnBounds(column);
  if (minWidth !== undefined && maxWidth !== undefined)
    return `clamp(${minWidth}px, ${width}, ${maxWidth}px)`;
  if (minWidth !== undefined) return `max(${minWidth}px, ${width})`;
  return maxWidth === undefined ? width : `min(${width}, ${maxWidth}px)`;
}

/**
 * The width of one unit of share, as CSS: the room the fixed tracks leave, split by weight, where
 * every capped share that its maximum stops gives its maximum and leaves its weight out. Each way
 * of stopping the capped shares in order of `maxWidth / weight` is a line, and the unit is the
 * largest of them: stopping a share that would not reach its cap only makes the unit smaller.
 */
function readShareUnit(shares: readonly Share[], fixed: readonly string[]): string {
  const room = ['100%', ...fixed].join(' - ');
  let weight = shares.reduce((total, share) => total + share.weight, 0);
  let capped = 0;
  const lines = [`(${room}) / ${weight}`];
  const stops = shares
    .filter((share): share is Share & { maxWidth: number } => share.maxWidth !== undefined)
    .sort((a, b) => a.maxWidth / a.weight - b.maxWidth / b.weight);
  for (const share of stops) {
    weight -= share.weight;
    capped += share.maxWidth;
    if (weight > 0) lines.push(`(${room} - ${capped}px) / ${weight}`);
  }
  return lines.length === 1
    ? `calc(${lines[0]})`
    : `max(${lines.map((line) => `calc(${line})`).join(', ')})`;
}

/**
 * A flexible track: an uncapped share takes `fr` of the room the other tracks leave, never below
 * its minimum; a capped share is its weight in units, kept inside its bounds, so its weight holds
 * until its cap stops it and the other shares then split what it leaves.
 */
function toShareTrack(share: Share, width: string, unit: string | null): string {
  const least = `${share.minWidth}px`;
  if (share.maxWidth === undefined || unit === null) return `minmax(${least}, ${width})`;
  return `clamp(${least}, calc(${unit} * ${share.weight}), ${share.maxWidth}px)`;
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
  const sized = structure.columns.map((column) => {
    const width = resolveColumnWidth(
      column,
      readOwn(input.widths, column.id),
      readOwn(input.contentWidths, column.id),
    );
    return { column, width, share: readShare(column, width) };
  });
  const fixed = sized.flatMap(({ column, width, share }) =>
    share ? [] : [toFixedTrack(column, width)],
  );
  if (structure.hasSelection) fixed.push(`${input.selectionWidth}px`);
  if (structure.hasActions) fixed.push(`${structure.actionsColumnWidth}px`);
  const shares = sized.flatMap(({ share }) => (share ? [share] : []));
  const unit = shares.some((share) => share.maxWidth !== undefined)
    ? readShareUnit(shares, fixed)
    : null;
  const tracks = sized.map(({ column, width, share }) =>
    share ? toShareTrack(share, String(width), unit) : toFixedTrack(column, width),
  );
  if (structure.hasSelection) tracks.unshift(`${input.selectionWidth}px`);
  if (structure.hasActions) tracks.push(`${structure.actionsColumnWidth}px`);
  return tracks.join(' ');
}
