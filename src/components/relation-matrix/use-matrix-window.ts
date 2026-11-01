'use client';

import { useLayoutEffect, useState, type RefObject, type UIEvent } from 'react';
import { useElementSize } from '../../utils/use-element-size.js';
import {
  listMatrixIndices,
  resolveMatrixColumnTracks,
  resolveMatrixSpan,
  type MatrixColumnTracks,
} from './matrix-window.js';
import type { MatrixPosition } from './matrix-navigation.js';

interface MatrixWindowOptions {
  /** The scroll container. */
  root: RefObject<HTMLDivElement | null>;
  /** The header row, whose height the rows start below. */
  header: RefObject<HTMLDivElement | null>;
  /** The corner header, whose width the columns start after. */
  corner: RefObject<HTMLDivElement | null>;
  virtualized: boolean;
  rowCount: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  /** The focused cell, which stays rendered when it scrolls out of view. */
  focus: MatrixPosition;
}

/** The rows and columns a matrix renders and the tracks that place the columns. */
interface MatrixWindow {
  rows: readonly number[];
  columns: readonly number[];
  tracks: MatrixColumnTracks;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
}

/** Items rendered beyond each edge of the view. */
const overscan = 2;
/** The view assumed before the first measurement (and where nothing measures, as in tests). */
const fallbackView = { width: 960, height: 480 };

/** A container's scroll offsets; right-to-left containers scroll to negative offsets. */
function readScroll(element: HTMLElement) {
  return { top: element.scrollTop, left: Math.abs(element.scrollLeft) };
}

function listAll(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

/**
 * Which rows and columns of a matrix to render: all of them, or with `virtualized` only those in
 * view of the scroll container (plus a small overscan and the focused cell), from its scroll
 * position, its size and the fixed row height and column width.
 */
export function useMatrixWindow(options: MatrixWindowOptions): MatrixWindow {
  const { root, header, corner, virtualized, rowCount, columnCount, rowHeight, columnWidth } =
    options;
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  // The offsets are tracked only while windowing, so turning it on reads where the container
  // already stands before the first window is painted.
  useLayoutEffect(() => {
    const element = root.current;
    if (!virtualized || !element) return;
    const next = readScroll(element);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The offsets live in the committed container, read before paint.
    setScroll((last) => (last.top === next.top && last.left === next.left ? last : next));
  }, [virtualized, root]);
  const view = useElementSize(root, { box: 'client' }) ?? fallbackView;
  const headerHeight = useElementSize(header, { box: 'border-box' })?.height ?? 0;
  const cornerWidth = useElementSize(corner, { box: 'border-box' })?.width ?? 0;
  const bodyHeight = Math.max(view.height - headerHeight, rowHeight);
  const rowSpan = virtualized
    ? resolveMatrixSpan({
        ...{ offset: scroll.top, extent: bodyHeight },
        ...{ size: rowHeight, count: rowCount, overscan },
      })
    : { start: 0, end: rowCount };
  const columnSpan = virtualized
    ? resolveMatrixSpan({
        ...{ offset: scroll.left, extent: view.width - cornerWidth },
        ...{ size: columnWidth, count: columnCount, overscan },
      })
    : { start: 0, end: columnCount };
  const rows = virtualized ? listMatrixIndices(rowSpan, options.focus.row) : listAll(rowCount);
  const columns = virtualized
    ? listMatrixIndices(columnSpan, options.focus.column)
    : listAll(columnCount);
  return {
    rows,
    columns,
    tracks: resolveMatrixColumnTracks({ indices: columns, count: columnCount, width: columnWidth }),
    onScroll: (event) => {
      const next = readScroll(event.currentTarget);
      if (virtualized && (next.top !== scroll.top || next.left !== scroll.left)) setScroll(next);
    },
  };
}
