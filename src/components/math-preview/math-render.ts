'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { renderMathMarkup } from './math-markup.js';

/** Inline math sits in a line of text; display math stands on its own line. */
export type MathDisplay = 'inline' | 'display';

export interface MathRenderOptions {
  displayMode: boolean;
}

/** A renderer's answer: MathML markup, or why the source does not typeset. */
export type MathRender = { ok: true; mathml: string } | { ok: false; message: string };

/** Typesets LaTeX source to MathML. The library renders the markup through its allow-list. */
export type MathRenderer = (
  source: string,
  options: MathRenderOptions,
) => MathRender | Promise<MathRender>;

/** Where a preview stands: nothing to show, typesetting, typeset, or refused. */
export type MathPreviewStatus = 'empty' | 'pending' | 'ready' | 'invalid';

interface Typeset {
  /** The source and display the answer is for. */
  key: string;
  math: ReactNode;
  message: string | null;
}

/** What a preview shows: its status, the math, why it failed, and whether the math is older. */
export interface MathPreviewState {
  status: MathPreviewStatus;
  /** The typeset math: the current source's, or while pending the last one typeset. */
  math: ReactNode;
  /** Why the current source does not typeset, as the renderer says. */
  message: string | null;
  /** The math shown is for older source, while the current source typesets. */
  isStale: boolean;
  /** The source is longer than the preview typesets. */
  isTooLong: boolean;
}

/** The longest source the preview typesets, in characters. */
export const DEFAULT_MATH_MAX_LENGTH = 10000;

/**
 * The preview of `source`: typeset by `renderer`, latest source wins. While a newer source is
 * typesetting, the last typeset math stays shown and marked stale, and an answer for an older
 * source, or one after unmounting, is dropped.
 */
export function useMathRender(options: {
  source: string;
  display: MathDisplay;
  renderer: MathRenderer;
  maxLength: number;
}) {
  const { source, display, maxLength } = options;
  const rendererRef = useLatest(options.renderer);
  const key = `${display}\n${source}`;
  const isEmpty = source.trim() === '';
  const isTooLong = source.length > maxLength;
  const [typeset, setTypeset] = useState<Typeset | null>(null);
  useEffect(() => {
    if (isEmpty || isTooLong) return undefined;
    let isCurrent = true;
    const settle = (next: Typeset) => {
      if (isCurrent) setTypeset(next);
    };
    Promise.resolve()
      .then(() => rendererRef.current(source, { displayMode: display === 'display' }))
      .then(
        (answer) =>
          settle(
            answer.ok
              ? { key, math: renderMathMarkup(answer.mathml), message: null }
              : { key, math: null, message: answer.message },
          ),
        (error: unknown) =>
          settle({
            key,
            math: null,
            message: error instanceof Error ? error.message : String(error),
          }),
      );
    return () => {
      isCurrent = false;
    };
  }, [key, source, display, isEmpty, isTooLong, rendererRef]);
  return readPreview({ typeset, key, isEmpty, isTooLong });
}

/** What the preview shows for the latest typeset answer and the current source. */
function readPreview(options: {
  typeset: Typeset | null;
  key: string;
  isEmpty: boolean;
  isTooLong: boolean;
}): MathPreviewState {
  const { typeset, key } = options;
  const base = { math: null, message: null, isStale: false, isTooLong: false };
  if (options.isEmpty) return { ...base, status: 'empty' };
  if (options.isTooLong) return { ...base, status: 'invalid', isTooLong: true };
  const isCurrent = typeset?.key === key;
  if (isCurrent && typeset.message !== null) {
    return { ...base, status: 'invalid', message: typeset.message };
  }
  const shown = typeset && typeset.message === null ? typeset.math : null;
  return {
    ...base,
    status: isCurrent ? 'ready' : 'pending',
    math: shown,
    isStale: !isCurrent && shown !== null,
  };
}
