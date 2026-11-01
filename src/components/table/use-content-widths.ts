'use client';

import { useLayoutEffect, useState, type Ref, type RefCallback } from 'react';
import { observeViewport } from '../../utils/observe-viewport.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import { isShallowEqual } from '../../utils/is-shallow-equal.js';
import type { TableColumnSizing } from './column-sizing.js';
import { measureContentWidths } from './measure-content-widths.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';

interface ContentWidths {
  ref: RefCallback<HTMLDivElement>;
  widths: Readonly<Record<string, number>>;
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
  useLayoutEffect(() => {
    if (!root || measuredColumns.length === 0) return;
    const grid = root.querySelector<HTMLElement>('.ui-table__grid');
    if (!grid) return;
    // Observe the live grid, not its parent: the temporary measurement table is its sibling.
    const observer = observeViewport(grid, getOwnerWindow(grid), {
      measure: () => {
        const next = measureContentWidths(root, measuredColumns);
        if (next) setWidths((previous) => (isShallowEqual(previous, next) ? previous : next));
      },
      getExtraTargets: () => [root],
      subtree: true,
      fonts: true,
    });
    return () => observer.disconnect();
  });
  return { ref, widths };
}
