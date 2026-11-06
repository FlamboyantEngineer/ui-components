import {
  type ITableCollection,
  type Key,
  LayoutInfo,
  Rect,
  type TableLayout,
} from '../../primitives/index.js';

/** The collection React Aria's table layout lays out. */
export type TableCollection = ITableCollection<unknown>;

/** A layout info of the summary row, kept while its place and size stay the same. */
function placeInfo(
  previous: ReadonlyMap<Key, LayoutInfo>,
  info: { type: string; key: Key; parentKey: Key; rect: Rect },
) {
  const kept = previous.get(info.key);
  if (kept && kept.parentKey === info.parentKey && kept.rect.equals(info.rect)) return kept;
  const placed = new LayoutInfo(info.type, info.key, info.rect);
  placed.parentKey = info.parentKey;
  placed.allowOverflow = true;
  placed.zIndex = info.type === 'cell' ? 1 : 0;
  return placed;
}

interface SummaryQuery {
  layout: TableLayout<unknown>;
  collection: TableCollection;
  /** What React Aria's layout returned for the visible rectangle. */
  infos: readonly LayoutInfo[];
  rowSize: number;
  previous: ReadonlyMap<Key, LayoutInfo>;
}

/** The cells of one summary row, placed under their columns from the column headers' layout. */
function summaryCells(query: SummaryQuery, row: { key: Key; rect: Rect }) {
  const { layout, collection, previous } = query;
  const cells: LayoutInfo[] = [];
  for (const cell of collection.getChildren?.(row.key) ?? []) {
    if (cell.type !== 'cell') continue;
    const first = cell.colIndex ?? cell.index;
    const spanned = collection.columns.slice(first, first + (cell.colSpan ?? 1));
    const columns = spanned.flatMap((column) => layout.getLayoutInfo(column.key) ?? []);
    const start = columns[0]?.rect.x ?? row.rect.x;
    const width = columns.reduce((sum, column) => sum + column.rect.width, 0);
    const rect = new Rect(start, row.rect.y, width, row.rect.height);
    cells.push(placeInfo(previous, { type: 'cell', key: cell.key, parentKey: row.key, rect }));
  }
  return cells;
}

/**
 * The summary rows React Aria's layout left out of the visible rectangle, placed where its footer
 * row group reserves them. React Aria lays out only the rows in view, so without them the summary
 * row would leave the document, and assistive technology, while the reader scrolls (UIC-TABLE-12.1).
 */
export function summaryInfos(query: SummaryQuery) {
  const { collection, infos, rowSize, previous } = query;
  const footer = [...collection].find((node) => node.type === 'tablefooter');
  const group = footer && infos.find((info) => info.key === footer.key);
  const header = infos.find((info) => info.type === 'header');
  if (!footer || !group || !header) return [];
  const shown = new Set(infos.map((info) => info.key));
  const placed: LayoutInfo[] = [];
  let y = group.rect.y;
  for (const row of collection.getChildren?.(footer.key) ?? []) {
    if (!shown.has(row.key)) {
      const rect = new Rect(group.rect.x, y, header.rect.width, rowSize);
      const info = placeInfo(previous, { type: 'row', key: row.key, parentKey: footer.key, rect });
      placed.push(info, ...summaryCells(query, info));
    }
    y += rowSize;
  }
  return placed;
}
