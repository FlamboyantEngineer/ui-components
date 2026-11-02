'use client';

import type { ReactNode } from 'react';
import type { Key } from '../../core/props.js';
import { ResizableTableContainer } from '../../primitives/index.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableVirtualizer } from './table-virtualizer.js';

interface TableScrollProps {
  /**
   * A virtualized table takes React Aria's measured layout; a static one sizes its columns as a
   * CSS grid, which no container measures (UIC-TABLE-4.6).
   */
  isVirtualized: boolean;
  rowHeight: number;
  hasGroupRow: boolean;
  /** Takes the widths React Aria reports while a column is resized, and when it ends. */
  widths: {
    onResize: (widths: Map<Key, unknown>) => void;
    onResizeEnd: (widths: Map<Key, unknown>) => void;
  };
  children: ReactNode;
}

/**
 * The table's scroll area: a plain one around a static table, else React Aria's resizable container,
 * which measures its width for the column widths, around the virtualizer.
 */
export function TableScroll(props: TableScrollProps) {
  const { isVirtualized, rowHeight, hasGroupRow, widths, children } = props;
  if (!isVirtualized) return <div className={hooks.slotClass('scroll')}>{children}</div>;
  return (
    <ResizableTableContainer
      className={hooks.slotClass('scroll')}
      onResize={widths.onResize}
      onResizeEnd={widths.onResizeEnd}
    >
      <TableVirtualizer rowHeight={rowHeight} hasGroupRow={hasGroupRow}>
        {children}
      </TableVirtualizer>
    </ResizableTableContainer>
  );
}
