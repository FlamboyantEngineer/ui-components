'use client';

import { useState } from 'react';
import { TableLayout } from '../../primitives/index.js';

type VisibleRect = Parameters<TableLayout<unknown>['getVisibleLayoutInfos']>[0];
type VisibleInfo = ReturnType<TableLayout<unknown>['getVisibleLayoutInfos']>[number];

/** A node of React Aria's table layout, as far as the summary row reads it. */
interface LayoutNodeView {
  node?: { type: string };
  layoutInfo: VisibleInfo;
  children?: LayoutNodeView[];
}

/** The protected parts of React Aria's table layout the summary row reaches into. */
interface LayoutInternals {
  rootNodes: readonly LayoutNodeView[];
  requestedRect: VisibleRect;
  buildRowGroup: (y: number, node: { type: string }) => LayoutNodeView;
}

/**
 * React Aria's virtualized table layout, keeping the summary row on the page. The layout builds
 * and draws only the rows in view, so a footer out of view would leave an empty row group behind
 * and the summary out of reach of assistive technology. It wraps one layout instance, since
 * library source extends no class (I1).
 */
function createTableFooterLayout(): TableLayout<unknown> {
  const layout = new TableLayout<unknown>();
  const internals = layout as unknown as LayoutInternals;
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
  return layout;
}

/** A virtualized table's layout that keeps its summary row in the document; stable per table. */
export function useTableFooterLayout(): TableLayout<unknown> {
  return useState(createTableFooterLayout)[0];
}
