'use client';

import { type ReactNode, type Ref, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { ResizableTableContainer } from '../../primitives/index.js';
import type { RevealLayout } from '../../utils/use-collection-handle.js';
import { tableHooks as hooks } from './table-hooks.js';
import { TableVirtualizer } from './table-virtualizer.js';
import { useFocusKeptInView } from './use-focus-kept-in-view.js';

interface TableScrollProps {
  /**
   * A virtualized table takes React Aria's measured layout; a static one sizes its columns as a
   * CSS grid, which no container measures (UIC-TABLE-4.6).
   */
  isVirtualized: boolean;
  /** Receives a virtualized table's layout, which the table's handle reads. */
  layoutRef: Ref<RevealLayout>;
  rowHeight: number;
  /** Measures each row's height from `rowHeight` as its estimate (UIC-TABLE-7.5). */
  measuresRows: boolean;
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
 * which measures its width for the column widths, around the virtualizer. A measured table keeps
 * the focused cell in view while its rows are measured.
 */
export function TableScroll(props: TableScrollProps) {
  const { isVirtualized, layoutRef, rowHeight, measuresRows, hasGroupRow, widths, children } =
    props;
  const scrollRef = useRef<HTMLDivElement>(null);
  useFocusKeptInView(scrollRef, isVirtualized && measuresRows);
  if (!isVirtualized) return <div className={hooks.slotClass('scroll')}>{children}</div>;
  return (
    <ResizableTableContainer
      ref={scrollRef}
      className={hooks.slotClass('scroll')}
      onResize={widths.onResize}
      onResizeEnd={widths.onResizeEnd}
    >
      <TableVirtualizer
        layoutRef={layoutRef}
        rowHeight={rowHeight}
        measuresRows={measuresRows}
        hasGroupRow={hasGroupRow}
      >
        {children}
      </TableVirtualizer>
    </ResizableTableContainer>
  );
}
