'use client';

import { type Ref, type RefCallback, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import { observeViewport } from '../../utils/observe-viewport.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type { TableColumnSizing } from './column-sizing.js';
import { measureContentWidths } from './measure-content-widths.js';

interface ContentWidths {
  ref: RefCallback<HTMLDivElement>;
  widths: Readonly<Record<string, number>>;
}

/** Measures the content columns whenever the grid's nodes, text, size or fonts change. */
function watchGrid(
  { root, grid, columns }: { root: HTMLElement; grid: HTMLElement; columns: readonly string[] },
  onMeasure: (widths: Readonly<Record<string, number>>) => void,
): () => void {
  // Observe the live grid, not its parent: the temporary measurement table is its sibling.
  const observer = observeViewport(grid, getOwnerWindow(grid), {
    measure: () => {
      const next = measureContentWidths(root, columns);
      if (next) onMeasure(next);
    },
    getExtraTargets: () => [root],
    subtree: true,
    // Focus, hover and selection move attributes between rows without changing any content.
    attributes: false,
    fonts: true,
  });
  return () => observer.disconnect();
}

/** Content tracks follow rendered content, host size and loaded fonts, without persisting measurements. */
export function useContentWidths(
  columns: readonly TableColumnSizing[],
  forwardedRef?: Ref<HTMLDivElement>,
): ContentWidths {
  const measuredColumns = useShallowStable(
    columns.filter((column) => column.width === 'content').map((column) => column.id),
  );
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const ref = useMergedRefs(forwardedRef, measuredColumns.length ? setRoot : undefined);
  const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
  // The grid element changes when the table switches layouts, such as into virtualization, so each
  // render looks it up; the observer starts again only when the grid or the measured columns change.
  const report = useCallback((next: Readonly<Record<string, number>>) => {
    setWidths((previous) => (isShallowEqual(previous, next) ? previous : next));
  }, []);
  const watch = useRef<{ grid: HTMLElement; columns: readonly string[]; stop: () => void } | null>(
    null,
  );
  useLayoutEffect(() => {
    const grid =
      root && measuredColumns.length ? root.querySelector<HTMLElement>('.ui-table__grid') : null;
    const current = watch.current;
    if (current?.grid === grid && current.columns === measuredColumns) return;
    current?.stop();
    watch.current =
      root && grid
        ? {
            grid,
            columns: measuredColumns,
            stop: watchGrid({ root, grid, columns: measuredColumns }, report),
          }
        : null;
  });
  useLayoutEffect(
    () => () => {
      watch.current?.stop();
      watch.current = null;
    },
    [],
  );
  return { ref, widths };
}
