'use client';

import { type RefObject, useEffect } from 'react';
import {
  EditorScrollbars,
  measureScrollTrackMark,
  type ScrollTrackMark,
  useEditorScrollbars,
} from '../scroll-region/scroll-region.js';
import { codeEditorHooks as hooks } from './code-editor-hooks.js';
import type { CodeDiagnostic } from './code-layers.js';

interface CodeScrollbarsProps {
  input: RefObject<HTMLTextAreaElement | null>;
  gutter: RefObject<HTMLDivElement | null>;
  inputId: string;
  diagnostics: readonly CodeDiagnostic[];
  value: string;
  lineCount: number;
  wrap: string;
}

function measureMarks({
  input,
  gutter,
  diagnostics,
}: Pick<CodeScrollbarsProps, 'input' | 'gutter' | 'diagnostics'>): ScrollTrackMark[] {
  const viewport = input.current;
  const lineGutter = gutter.current;
  if (!viewport || !lineGutter) return [];
  const height = viewport.scrollHeight;
  if (height <= viewport.clientHeight) return [];
  const lines = lineGutter.children;
  return diagnostics.flatMap((diagnostic) => {
    if (diagnostic.line === undefined) return [];
    const start = diagnostic.line - 1;
    const first = lines[start];
    if (!first) return [];
    const end = Math.max(
      start,
      Math.min(lines.length - 1, (diagnostic.endLine ?? diagnostic.line) - 1),
    );
    const last = lines[end] ?? first;
    return [
      measureScrollTrackMark(
        { first, last, severity: diagnostic.severity ?? 'error' },
        lineGutter,
        height,
      ),
    ];
  });
}

/** The editor's custom scrollbars share the native viewport, with diagnostics painted inside the vertical track. */
export function CodeScrollbars(props: CodeScrollbarsProps) {
  const { input, inputId, gutter, diagnostics, value, lineCount, wrap } = props;
  const scrollbars = useEditorScrollbars(input);
  const {
    updateMarks,
    measurement: { schedule },
  } = scrollbars;
  useEffect(() => schedule(), [schedule, value, wrap]);
  useEffect(() => {
    if (diagnostics.length === 0) {
      updateMarks([]);
      return undefined;
    }
    const update = () => updateMarks(measureMarks({ input, gutter, diagnostics }));
    update();
    // A line that wraps anew moves the marks after it without resizing the gutter, so each row is
    // watched; the rows are watched again only when lines are added or removed, not per keystroke.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (input.current) observer?.observe(input.current);
    if (gutter.current) {
      observer?.observe(gutter.current);
      for (const line of gutter.current.children) observer?.observe(line);
    }
    return () => observer?.disconnect();
  }, [input, gutter, diagnostics, wrap, lineCount, updateMarks]);
  return <EditorScrollbars viewportId={inputId} hooks={hooks} scrollbars={scrollbars} horizontal />;
}
