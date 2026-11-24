'use client';

import { type RefObject, useCallback, useEffect, useState } from 'react';
import type { ComponentHooks } from '../../core/hooks.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import type { FieldSeverity } from '../field/field.js';
import { OverlayScrollbars } from './overlay-scrollbars.js';
import { useOverlayMetrics } from './use-overlay-metrics.js';
import { useSharedViewportObserver } from './use-shared-viewport-observer.js';

/** A marker's span along the vertical track, as fractions of the content's height. */
export interface ScrollTrackMark {
  top: number;
  height: number;
  severity: FieldSeverity;
}

interface EditorScrollbarsProps {
  viewportId: string;
  scrollbars: ReturnType<typeof useEditorScrollbars>;
  hooks: Pick<ComponentHooks<'scrollbars' | 'scroll-marker'>, 'slot'>;
  /** Also draws a horizontal track when the viewport scrolls sideways. */
  horizontal?: boolean | undefined;
}

/** Measures an editor's marked rows in the coordinate system of its scroller or gutter. */
export function measureScrollTrackMark(
  { first, last, severity }: { first: Element; last: Element; severity: FieldSeverity },
  scroller: HTMLElement,
  contentHeight: number,
): ScrollTrackMark {
  const start = measureInScroller(first, scroller);
  const end = last === first ? start : measureInScroller(last, scroller);
  return {
    top: start.top / contentHeight,
    height: (end.top + end.height - start.top) / contentHeight,
    severity,
  };
}

/** Keeps overlay geometry in sync with a native editable viewport and retains equal marks. */
export function useEditorScrollbars(viewport: RefObject<HTMLElement | null>) {
  const observer = useSharedViewportObserver(viewport);
  const measurement = useOverlayMetrics({ viewport, observer, enabled: true, headerInset: false });
  const [marks, setMarks] = useState<readonly ScrollTrackMark[]>([]);
  const { schedule } = measurement;
  useEffect(() => {
    const element = viewport.current;
    if (!element) return undefined;
    element.addEventListener('scroll', schedule);
    schedule();
    return () => element.removeEventListener('scroll', schedule);
  }, [viewport, schedule]);
  const updateMarks = useCallback((next: readonly ScrollTrackMark[]) => {
    setMarks((previous) =>
      previous.length === next.length &&
      previous.every(
        (mark, index) =>
          mark.top === next[index]?.top &&
          mark.height === next[index]?.height &&
          mark.severity === next[index]?.severity,
      )
        ? previous
        : next,
    );
  }, []);
  return { viewport, measurement, marks, updateMarks };
}

/** Draws the editor's tracks and marks while its native viewport overflows. */
export function EditorScrollbars({
  viewportId,
  scrollbars,
  hooks,
  horizontal,
}: EditorScrollbarsProps) {
  const { viewport, measurement, marks } = scrollbars;
  const { metrics } = measurement;
  return (
    <div {...hooks.slot('scrollbars')}>
      <OverlayScrollbars
        tabIndex={-1}
        viewport={viewport}
        viewportId={viewportId}
        measurement={measurement}
        drawX={horizontal === true && metrics.contentWidth > metrics.width + 1}
        drawY={metrics.contentHeight > metrics.height + 1}
        isVisible
        verticalMarks={marks.map((mark, index) => (
          <span
            key={index}
            {...hooks.slot('scroll-marker', { severity: mark.severity })}
            aria-hidden="true"
            style={{ top: `${mark.top * 100}%`, height: `${mark.height * 100}%` }}
          />
        ))}
      />
    </div>
  );
}
