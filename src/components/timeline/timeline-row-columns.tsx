'use client';

// The row list's property columns: built-in duration and dependencies, or the host's own, beside
// each row's name (specs/TIMELINE.md, UIC-TIMELINE-1.13).

import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { readTimelineItem, type TimelineItem } from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import type { ItemPredecessors } from './timeline-layout.js';
import type { TimelineRow } from './timeline-rows.js';

/** A built-in row property: the item's length in days, or the items it depends on. */
export type TimelineRowColumnKind = 'duration' | 'dependencies';

/** What a row property is read from: the row, its own items (not its children's) and its kind. */
export interface TimelineRowContext {
  row: TimelineRow;
  items: readonly TimelineItem[];
  isGroup: boolean;
}

/** A host row property: a heading and the value it shows for each row. */
export interface TimelineRowColumn {
  id: Key;
  header: string;
  /** The row's value; `null` or `undefined` leaves the cell empty. */
  renderValue: (context: TimelineRowContext) => ReactNode;
}

/** A built-in row property by name, or a host one. */
export type TimelineRowColumnEntry = TimelineRowColumnKind | TimelineRowColumn;

const dayLength = 86_400_000;

/** A column's identity for the stylesheet: the built-in's name or the host id as text. */
export function readColumnId(column: TimelineRowColumnEntry): string {
  return typeof column === 'string' ? column : String(column.id);
}

/** The heading of a column. */
export function useColumnHeader() {
  const strings = useUiStrings();
  return (column: TimelineRowColumnEntry) => {
    if (column === 'duration') return strings.timelineDurationColumn;
    if (column === 'dependencies') return strings.timelineDependenciesColumn;
    return column.header;
  };
}

/**
 * A built-in value: a row with one item shows that item's length or predecessors; a row with
 * several shows how many it holds rather than an aggregate; a row without items shows nothing.
 */
function useBuiltInValue(predecessors: ReadonlyMap<Key, ItemPredecessors>) {
  const strings = useUiStrings();
  return (kind: TimelineRowColumnKind, items: readonly TimelineItem[]): ReactNode => {
    const [only] = items;
    if (!only) return null;
    if (items.length > 1) return strings.timelineItemCount(items.length);
    if (kind === 'dependencies') {
      return predecessors.get(only.id)?.names.join(', ') ?? strings.timelineNone;
    }
    const read = readTimelineItem(only);
    if (!read) return null;
    if (read.kind === 'milestone') return strings.timelineDuration(0);
    return strings.timelineDuration(
      (Date.parse(read.end) - Date.parse(read.start)) / dayLength + 1,
    );
  };
}

/** A row's property values, each with its heading for assistive technology. */
export function TimelineRowValues({
  columns,
  context,
  predecessors,
}: {
  columns: readonly TimelineRowColumnEntry[];
  context: TimelineRowContext;
  predecessors: ReadonlyMap<Key, ItemPredecessors>;
}) {
  const header = useColumnHeader();
  const builtIn = useBuiltInValue(predecessors);
  return columns.map((column) => {
    const value =
      typeof column === 'string' ? builtIn(column, context.items) : column.renderValue(context);
    const id = readColumnId(column);
    return (
      <span key={id} {...hooks.slot('row-value', { column: id })}>
        {value === null || value === undefined ? null : (
          <>
            <VisuallyHidden>{`${header(column)}: `}</VisuallyHidden>
            {value}
          </>
        )}
      </span>
    );
  });
}

/** The column headings, in the corner above the row list; the values carry them for readers. */
export function TimelineRowHeadings({ columns }: { columns: readonly TimelineRowColumnEntry[] }) {
  const header = useColumnHeader();
  if (columns.length === 0) return null;
  return (
    <div {...hooks.slot('row-headings')} aria-hidden="true">
      {columns.map((column) => (
        <span
          key={readColumnId(column)}
          {...hooks.slot('row-heading', { column: readColumnId(column) })}
        >
          {header(column)}
        </span>
      ))}
    </div>
  );
}
