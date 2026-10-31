'use client';

import { useRef } from 'react';
import { resolveDropPosition } from '../../utils/pointer-drag.js';
import { useItemDrag } from '../../utils/use-item-drag.js';
import type { TableColumnDrag } from './use-column-reorder.js';

interface ColumnDragOptions {
  id: string;
  textValue: string;
  /** Whether the column itself drags; any data column takes drops of another. */
  allowsReordering: boolean;
  /** The table's shared drag, or null while no column of the table reorders. */
  drag: TableColumnDrag | null;
}

const noDrag: TableColumnDrag = {
  dragType: '',
  dragging: { current: null },
  isRtl: false,
  moveColumn: () => {},
};

/**
 * One data column header's drag and drop on the shared item drag: its label drags the column, and
 * its content takes another column of the same table, which lands before or after it by the half
 * the pointer is over, in reading order.
 */
export function useColumnDrag({
  id,
  textValue,
  allowsReordering,
  drag: shared,
}: ColumnDragOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = shared ?? noDrag;
  const { sourceProps, targetProps, dropPosition, isDragging } = useItemDrag({
    ref,
    key: id,
    textValue,
    dragType: drag.dragType,
    dragging: drag.dragging,
    isDisabled: !shared || !allowsReordering,
    isDropDisabled: !shared,
    resolveMove: ({ x, y }) => {
      const dragged = drag.dragging.current;
      if (dragged === null || dragged === id) return null;
      const box = ref.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
      const { width, height } = box;
      const position = resolveDropPosition({
        ...{ width, height, x, y },
        orientation: 'horizontal',
        isRtl: drag.isRtl,
      });
      return { id: dragged, targetId: id, position };
    },
    onMove: drag.moveColumn,
  });
  return { ref, sourceProps, targetProps, dropPosition, isDragging };
}
