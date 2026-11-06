'use client';

import { type ReactNode, type Ref, useImperativeHandle, useState } from 'react';
import { Virtualizer } from '../../primitives/index.js';
import type { RevealLayout } from '../../utils/use-collection-handle.js';
import { createTableLayout, type TableLayoutOptions } from './table-layout.js';

/**
 * The virtualizer of a virtualized table: React Aria's table layout at a fixed row height, or
 * measuring each row from `rowHeight` as its estimate, keeping the summary row in the document and,
 * with column groups, a group header row of `rowHeight` above the column headers.
 */
export function TableVirtualizer({
  layoutRef,
  rowHeight,
  measuresRows,
  hasGroupRow,
  children,
}: {
  /** Receives the table's layout, which its handle reads. */
  layoutRef: Ref<RevealLayout>;
  rowHeight: number;
  measuresRows: boolean;
  hasGroupRow: boolean;
  children: ReactNode;
}) {
  // React Aria's layout keeps a fixed row height once given one, so each mode has its own layout.
  const [mode, setMode] = useState(() => ({ measuresRows, layout: createTableLayout() }));
  if (mode.measuresRows !== measuresRows) setMode({ measuresRows, layout: createTableLayout() });
  const { layout } = mode;
  useImperativeHandle(layoutRef, () => layout, [layout]);
  const layoutOptions: TableLayoutOptions = {
    ...(measuresRows ? { estimatedRowHeight: rowHeight } : { rowHeight }),
    headingHeight: rowHeight,
    groupRowHeight: hasGroupRow ? rowHeight : 0,
  };
  return (
    <Virtualizer layout={layout} layoutOptions={layoutOptions} shouldObserveItemSize={measuresRows}>
      {children}
    </Virtualizer>
  );
}
