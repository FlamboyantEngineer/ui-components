'use client';

import { type RefObject, useEffect, useState } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import { measureInScroller } from '../../utils/scroll-geometry.js';
import {
  OverlayScrollbars,
  useOverlayMetrics,
  useSharedViewportObserver,
} from '../scroll-region/scroll-region.js';
import { codeEditorHooks as hooks } from './code-editor-hooks.js';
import type { CodeDiagnostic } from './code-layers.js';

interface CodeScrollbarsProps {
  input: RefObject<HTMLTextAreaElement | null>;
  gutter: RefObject<HTMLDivElement | null>;
  inputId: string;
  diagnostics: readonly CodeDiagnostic[];
  value: string;
  wrap: string;
}
interface CodeScrollMark {
  top: number;
  height: number;
  severity: string;
}

function measureMarks({
  input,
  gutter,
  diagnostics,
}: Pick<CodeScrollbarsProps, 'input' | 'gutter' | 'diagnostics'>): CodeScrollMark[] {
  const viewport = input.current;
  const lines = gutter.current?.children;
  if (!viewport || !lines || viewport.scrollHeight <= viewport.clientHeight) return [];
  const lineGutter = requireDefined(gutter.current);
  return diagnostics.flatMap((diagnostic) => {
    const start = diagnostic.line === undefined ? undefined : lines[diagnostic.line - 1];
    if (!start) return [];
    const end =
      lines[
        Math.max(
          requireDefined(diagnostic.line) - 1,
          Math.min(lines.length - 1, (diagnostic.endLine ?? requireDefined(diagnostic.line)) - 1),
        )
      ] ?? start;
    const top = measureInScroller(start, lineGutter).top;
    const last = measureInScroller(end, lineGutter);
    const bottom = last.top + last.height;
    return [
      {
        top: top / viewport.scrollHeight,
        height: (bottom - top) / viewport.scrollHeight,
        severity: diagnostic.severity ?? 'error',
      },
    ];
  });
}

/** The editor's custom scrollbars share the native viewport, with diagnostics painted inside the vertical track. */
export function CodeScrollbars(props: CodeScrollbarsProps) {
  const { input, inputId, gutter, diagnostics, value, wrap } = props;
  const observer = useSharedViewportObserver(input);
  const measurement = useOverlayMetrics({
    viewport: input,
    observer,
    enabled: true,
    headerInset: false,
  });
  const [marks, setMarks] = useState<CodeScrollMark[]>([]);
  const { schedule } = measurement;
  useEffect(() => {
    const viewport = input.current;
    if (!viewport) return undefined;
    viewport.addEventListener('scroll', schedule);
    schedule();
    return () => viewport.removeEventListener('scroll', schedule);
  }, [input, schedule, value, wrap]);
  useEffect(() => {
    const update = () => {
      const next = measureMarks({ input, gutter, diagnostics });
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
    };
    update();
    // A line that grows or shrinks moves the lines after it and resizes the gutter, so watching the
    // gutter and the input covers every move of a mark; typing within a line needs no new measure.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (input.current) observer?.observe(input.current);
    if (gutter.current) observer?.observe(gutter.current);
    return () => observer?.disconnect();
  }, [input, gutter, diagnostics, wrap]);
  const { metrics } = measurement;
  return (
    <div {...hooks.slot('scrollbars')}>
      <OverlayScrollbars
        tabIndex={-1}
        viewport={input}
        viewportId={inputId}
        measurement={measurement}
        drawX={metrics.contentWidth > metrics.width + 1}
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
