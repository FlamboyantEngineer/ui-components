'use client';

import { type RefObject, type UIEvent, useLayoutEffect, useMemo, useState } from 'react';
import { useElementSize } from '../../utils/use-element-size.js';
import type { MatrixPosition } from './matrix-navigation.js';
import {
  listMatrixIndices,
  type MatrixColumnTracks,
  resolveMatrixColumnTracks,
  resolveMatrixSpan,
} from './matrix-window.js';

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

/** The indices of a span with the focused index, the same array while neither changes. */
function useSpanIndices(span: { start: number; end: number }, focused: number): readonly number[] {
  // The focused index changes the list only while it lies outside the span.
  const extra = focused < span.start || focused >= span.end ? focused : -1;
  return useMemo(
    () => listMatrixIndices({ start: span.start, end: span.end }, extra),
    [span.start, span.end, extra],
  );
}

/**
 * Which rows and columns of a matrix to render: all of them, or with `virtualized` only those in
 * view of the scroll container (plus a small overscan and the focused cell), from its scroll
 * position, its size and the fixed row height and column width. A scroll that keeps the same rows
 * and columns in view renders nothing again, and the lists keep their identity until they change.
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
  const resolveSpans = (offsets: { top: number; left: number }) => ({
    rows: virtualized
      ? resolveMatrixSpan({
          ...{ offset: offsets.top, extent: bodyHeight },
          ...{ size: rowHeight, count: rowCount, overscan },
        })
      : { start: 0, end: rowCount },
    columns: virtualized
      ? resolveMatrixSpan({
          ...{ offset: offsets.left, extent: view.width - cornerWidth },
          ...{ size: columnWidth, count: columnCount, overscan },
        })
      : { start: 0, end: columnCount },
  });
  const spans = resolveSpans(scroll);
  const rows = useSpanIndices(spans.rows, virtualized ? options.focus.row : -1);
  const columns = useSpanIndices(spans.columns, virtualized ? options.focus.column : -1);
  const tracks = useMemo(
    () => resolveMatrixColumnTracks({ indices: columns, count: columnCount, width: columnWidth }),
    [columns, columnCount, columnWidth],
  );
  return {
    rows,
    columns,
    tracks,
    onScroll: (event) => {
      if (!virtualized) return;
      const next = readScroll(event.currentTarget);
      const nextSpans = resolveSpans(next);
      // Offsets that keep the same span render nothing; the overscan covers the stale offset.
      if (!isSameSpan(nextSpans.rows, spans.rows) || !isSameSpan(nextSpans.columns, spans.columns))
        setScroll(next);
    },
  };
}

function isSameSpan(left: { start: number; end: number }, right: { start: number; end: number }) {
  return left.start === right.start && left.end === right.end;
}
