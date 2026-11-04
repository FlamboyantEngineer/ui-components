'use client';

import { type ReactNode, useState } from 'react';
import { TableLayout, Virtualizer } from '../../primitives/index.js';

type VisibleRect = Parameters<TableLayout<unknown>['getVisibleLayoutInfos']>[0];
type VisibleInfo = ReturnType<TableLayout<unknown>['getVisibleLayoutInfos']>[number];

/** A node of React Aria's table layout, as far as the summary row reads it. */
interface LayoutNodeView {
  node?: { type: string };
  layoutInfo: VisibleInfo;
  children?: LayoutNodeView[];
}

/** The layout options a virtualized table passes, with the height of its group header row. */
interface TableLayoutOptions {
  rowHeight: number;
  headingHeight: number;
  /** The group header row's height above the column headers; 0 draws none. */
  groupRowHeight: number;
}

type InvalidationContext = Parameters<TableLayout<unknown>['update']>[0];

/** The protected parts of React Aria's table layout the summary and group rows reach into. */
interface LayoutInternals {
  rootNodes: readonly LayoutNodeView[];
  requestedRect: VisibleRect;
  buildRowGroup: (y: number, node: { type: string }) => LayoutNodeView;
  buildHeaderRow: (row: unknown, x: number, y: number) => LayoutNodeView;
}

/**
 * Keeps the summary row on the page. The layout builds and draws only the rows in view, so a
 * footer out of view would leave an empty row group behind and the summary out of reach of
 * assistive technology.
 */
function keepFooterInView(layout: TableLayout<unknown>, internals: LayoutInternals) {
  const buildRowGroup = internals.buildRowGroup.bind(layout);
  // The footer's rows are built wherever the reader has scrolled.
  internals.buildRowGroup = (y, node) => {
    if (node.type !== 'tablefooter') return buildRowGroup(y, node);
    const requested = internals.requestedRect;
    const whole = requested.copy();
    whole.y = 0;
    whole.height = Number.MAX_SAFE_INTEGER;
    internals.requestedRect = whole;
    try {
      return buildRowGroup(y, node);
    } finally {
      internals.requestedRect = requested;
    }
  };
  const getVisibleLayoutInfos = layout.getVisibleLayoutInfos.bind(layout);
  layout.getVisibleLayoutInfos = (rect) => {
    const infos = getVisibleLayoutInfos(rect);
    const footer = internals.rootNodes.find((root) => root.node?.type === 'tablefooter');
    const shown = new Set(infos.map((info) => info.key));
    for (const row of footer?.children ?? []) {
      if (shown.has(row.layoutInfo.key)) continue;
      infos.push(row.layoutInfo, ...(row.children ?? []).map((cell) => cell.layoutInfo));
    }
    return infos;
  };
}

/**
 * Lowers the column header row by the group row's height, so the header, and the rows after it,
 * leave the group row its place at the top of the header.
 */
function makeRoomForGroupRow(layout: TableLayout<unknown>, internals: LayoutInternals) {
  let groupRowHeight = 0;
  const readHeight = (options: unknown) =>
    (options as Partial<TableLayoutOptions> | undefined)?.groupRowHeight ?? 0;
  const buildHeaderRow = internals.buildHeaderRow.bind(layout);
  internals.buildHeaderRow = (row, x, y) => buildHeaderRow(row, x, y + groupRowHeight);
  const update = layout.update.bind(layout);
  layout.update = (context: InvalidationContext) => {
    groupRowHeight = readHeight(context.layoutOptions);
    update(context);
  };
  const shouldInvalidate = layout.shouldInvalidateLayoutOptions.bind(layout);
  layout.shouldInvalidateLayoutOptions = (next, previous) =>
    readHeight(next) !== readHeight(previous) || shouldInvalidate(next, previous);
}

/**
 * React Aria's virtualized table layout, keeping the summary row on the page and leaving room for
 * the group header row. It wraps one layout instance, since library source extends no class (I1).
 */
function createTableLayout(): TableLayout<unknown> {
  const layout = new TableLayout<unknown>();
  const internals = layout as unknown as LayoutInternals;
  keepFooterInView(layout, internals);
  makeRoomForGroupRow(layout, internals);
  return layout;
}

/**
 * The virtualizer of a virtualized table: React Aria's table layout at a fixed row height, keeping
 * the summary row in the document and, with column groups, a group header row of `rowHeight` above
 * the column headers.
 */
export function TableVirtualizer({
  rowHeight,
  hasGroupRow,
  children,
}: {
  rowHeight: number;
  hasGroupRow: boolean;
  children: ReactNode;
}) {
  const [layout] = useState(createTableLayout);
  const layoutOptions: TableLayoutOptions = {
    rowHeight,
    headingHeight: rowHeight,
    groupRowHeight: hasGroupRow ? rowHeight : 0,
  };
  return (
    <Virtualizer layout={layout} layoutOptions={layoutOptions}>
      {children}
    </Virtualizer>
  );
}
