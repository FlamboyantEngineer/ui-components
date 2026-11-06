'use client';

import { type ReactNode, type Ref, useImperativeHandle, useState } from 'react';
import { Virtualizer } from '../../primitives/index.js';
import type { RevealLayout } from '../../utils/use-collection-handle.js';
import { createTableLayout, type TableLayoutOptions } from './table-layout.js';

/**
 * The virtualizer of a virtualized table: React Aria's table layout at a fixed row height, keeping
 * the summary row in the document and, with column groups, a group header row of `rowHeight` above
 * the column headers.
 */
export function TableVirtualizer({
  layoutRef,
  rowHeight,
  hasGroupRow,
  children,
}: {
  /** Receives the table's layout, which its handle reads. */
  layoutRef: Ref<RevealLayout>;
  rowHeight: number;
  hasGroupRow: boolean;
  children: ReactNode;
}) {
  const [layout] = useState(createTableLayout);
  useImperativeHandle(layoutRef, () => layout, [layout]);
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
